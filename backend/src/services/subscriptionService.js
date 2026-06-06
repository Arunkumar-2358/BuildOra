import ContractorSubscription from "../models/ContractorSubscription.js";
import SubscriptionPlan from "../models/SubscriptionPlan.js";
import User from "../models/User.js";
import { createNotification } from "./notificationService.js";
import { getSettings } from "./settingsService.js";

const DAY_MS = 24 * 60 * 60 * 1000;

// Plan hierarchy: higher number = higher tier.
const TIER_RANK = { free: 0, pro: 1, premium: 2 };

// Whole days remaining until `date` (0 if absent or already past).
export const remainingDays = (date) => {
  if (!date) return 0;
  const diff = new Date(date).getTime() - Date.now();
  return diff <= 0 ? 0 : Math.ceil(diff / DAY_MS);
};

/**
 * Month arithmetic that never overflows. setMonth(1) on Jan 31 would produce
 * Mar 3; instead we set day=1 first, advance months, then restore the original
 * day clamped to the new month's length. This matches how Stripe / Chargebee
 * handle monthly billing periods.
 */
const addMonths = (date, months) => {
  const d = new Date(date);
  const originalDay = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const maxDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(originalDay, maxDay));
  return d;
};

// A project is premium-only once Phase 3 sets project.visibility = "premium".
const isPremiumOnly = (project) => project?.visibility === "premium";

// The contractor's current active subscription (status "active" AND endDate > now).
export const getActiveSubscription = (contractorId) =>
  ContractorSubscription.findOne({
    contractor: contractorId,
    status: "active",
    endDate: { $gt: new Date() }
  })
    .sort({ endDate: -1 })
    .populate("plan");

// The contractor's earliest queued subscription (status "scheduled").
const getScheduledSubscription = (contractorId) =>
  ContractorSubscription.findOne({ contractor: contractorId, status: "scheduled" })
    .sort({ startDate: 1 })
    .populate("plan");

// Mirror a contractor's live subscription onto the User cache used for fast bid-gating.
export const refreshContractorCache = async (contractorId) => {
  const [active, scheduled, user] = await Promise.all([
    getActiveSubscription(contractorId),
    getScheduledSubscription(contractorId),
    User.findById(contractorId)
  ]);
  if (!user || user.role !== "contractor") return null;
  if (!user.contractorProfile) user.contractorProfile = {};
  const p = user.contractorProfile;

  if (active) {
    p.subscriptionTier = active.tier;
    p.subscriptionStatus = "active";
    p.subscriptionExpiresAt = active.endDate;
    p.isPremium = active.tier === "premium";
    p.premiumExpiresAt = active.tier === "premium" ? active.endDate : undefined;
  } else if (scheduled) {
    // No active plan, but a paid plan is queued — downgrade to free until cron fires.
    p.subscriptionTier = "free";
    p.subscriptionStatus = "scheduled";
    p.subscriptionExpiresAt = undefined;
    p.isPremium = false;
    p.premiumExpiresAt = undefined;
  } else {
    p.subscriptionTier = "free";
    p.subscriptionStatus = p.subscriptionStatus === "active" ? "expired" : (p.subscriptionStatus || "none");
    p.subscriptionExpiresAt = undefined;
    p.isPremium = false;
    p.premiumExpiresAt = undefined;
  }
  user.markModified("contractorProfile");
  await user.save();
  return user;
};

// Build a 402 "needs payment" error the global error handler will surface with
// a machine-readable `code` the frontend uses to route the contractor to /plans.
const bidBlock = (code, message, details) => {
  const err = new Error(message);
  err.statusCode = 402;
  err.code = code;
  if (details) err.details = details;
  return err;
};

/**
 * Decide whether `user` may bid on `project`. Returns { consumeFreeBid } on
 * success (the caller increments the free counter only after the bid actually
 * persists) or throws a 402 when blocked. Editing an existing bid never costs a
 * free credit.
 */
export const assertCanBid = async ({ user, project, isNewBid }) => {
  const profile = user.contractorProfile || {};
  const tier = profile.subscriptionTier || "free";
  const active =
    profile.subscriptionStatus === "active" &&
    (!profile.subscriptionExpiresAt || new Date(profile.subscriptionExpiresAt) > new Date());

  if (isPremiumOnly(project)) {
    if (active && profile.isPremium) return { consumeFreeBid: false };
    throw bidBlock("PREMIUM_REQUIRED", "This is a premium-only project. Upgrade to Premium to place a bid.");
  }

  if (active && (tier === "pro" || tier === "premium")) return { consumeFreeBid: false };

  if (!isNewBid) return { consumeFreeBid: false };

  const settings = await getSettings();
  const used = profile.freeBidsUsed || 0;
  if (used >= settings.freeBidQuota) {
    throw bidBlock(
      "FREE_LIMIT_REACHED",
      `You've used all ${settings.freeBidQuota} free bids. Subscribe to Pro for unlimited bidding.`,
      { freeBidsUsed: used, freeBidQuota: settings.freeBidQuota }
    );
  }
  return { consumeFreeBid: true };
};

// Atomically consume one free-trial credit (called after a free-tier bid persists).
export const consumeFreeBid = (contractorId) =>
  User.updateOne({ _id: contractorId }, { $inc: { "contractorProfile.freeBidsUsed": 1 } });

/**
 * Activate a paid subscription after a verified payment. Implements a proper
 * state machine so paid time is NEVER lost:
 *
 *  • No existing plan  → activate immediately.
 *  • Downgrade (e.g. Premium → Pro) → schedule Pro to start when Premium expires;
 *    Premium access continues uninterrupted.
 *  • Upgrade (e.g. Pro → Premium) → cancel Pro, credit remaining Pro days onto
 *    the new Premium end date, activate Premium immediately.
 *  • Same tier (Pro + Pro) → cancel existing, start new period from old endDate
 *    so days stack (never overwrite / shorten).
 */
export const activateSubscription = async ({ contractorId, plan, transaction }) => {
  const now = new Date();
  const existing = await getActiveSubscription(contractorId);
  const existingScheduled = await ContractorSubscription.findOne({
    contractor: contractorId,
    status: "scheduled"
  });

  // ── Case 1: No active subscription → activate immediately ──────────────────
  if (!existing) {
    // Cancel any stale scheduled subscription before creating the new active one.
    if (existingScheduled) {
      await ContractorSubscription.updateMany(
        { contractor: contractorId, status: "scheduled" },
        { $set: { status: "cancelled", cancelledAt: now } }
      );
    }
    const start = now;
    const end = addMonths(start, plan.durationMonths);
    const sub = await ContractorSubscription.create({
      contractor: contractorId,
      plan: plan._id,
      planCode: plan.code,
      tier: plan.tier,
      status: "active",
      startDate: start,
      endDate: end,
      amountPaise: plan.pricePaise,
      currency: plan.currency,
      transaction: transaction?._id || transaction
    });
    await refreshContractorCache(contractorId);
    return sub;
  }

  const newRank = TIER_RANK[plan.tier] ?? 0;
  const existingRank = TIER_RANK[existing.tier] ?? 0;

  // ── Case 2: Downgrade — buying a lower tier while a higher tier is active ──
  // Example: Premium active until 05 Jul, user buys Pro on 20 Jun.
  // → Keep Premium active; queue Pro to start on 05 Jul.
  if (newRank < existingRank) {
    // Replace any prior scheduled sub (user re-bought before expiry).
    if (existingScheduled) {
      await ContractorSubscription.updateMany(
        { contractor: contractorId, status: "scheduled" },
        { $set: { status: "cancelled", cancelledAt: now } }
      );
    }
    const start = existing.endDate;
    const end = addMonths(start, plan.durationMonths);
    const sub = await ContractorSubscription.create({
      contractor: contractorId,
      plan: plan._id,
      planCode: plan.code,
      tier: plan.tier,
      status: "scheduled",  // NOT active — will flip when current plan expires
      startDate: start,
      endDate: end,
      amountPaise: plan.pricePaise,
      currency: plan.currency,
      transaction: transaction?._id || transaction
    });
    // Intentionally do NOT call refreshContractorCache — existing Premium stays active.
    return sub;
  }

  // ── Case 3: Upgrade — buying a higher tier than currently active ───────────
  // Example: Pro active until 05 Jul, user buys Premium on 20 Jun.
  // → Cancel Pro; credit the 15 remaining Pro days onto Premium's period.
  if (newRank > existingRank) {
    const remainingMs = Math.max(0, existing.endDate.getTime() - now.getTime());
    const remainingDaysCredit = Math.floor(remainingMs / DAY_MS);

    await ContractorSubscription.updateMany(
      { contractor: contractorId, status: { $in: ["active", "scheduled"] } },
      { $set: { status: "cancelled", cancelledAt: now } }
    );

    const start = now;
    const baseEnd = addMonths(start, plan.durationMonths);
    // Extend by the credited days so the user loses nothing they already paid for.
    const end = new Date(baseEnd.getTime() + remainingDaysCredit * DAY_MS);
    const sub = await ContractorSubscription.create({
      contractor: contractorId,
      plan: plan._id,
      planCode: plan.code,
      tier: plan.tier,
      status: "active",
      startDate: start,
      endDate: end,
      amountPaise: plan.pricePaise,
      currency: plan.currency,
      transaction: transaction?._id || transaction
    });
    await refreshContractorCache(contractorId);
    return sub;
  }

  // ── Case 4: Same tier — extend (stack endDate, never overwrite) ────────────
  // Example: Pro until 05 Jul, user buys Pro again on 20 Jun → extends to 05 Aug.
  await ContractorSubscription.updateMany(
    { contractor: contractorId, status: "active" },
    { $set: { status: "cancelled", cancelledAt: now } }
  );
  if (existingScheduled) {
    await ContractorSubscription.updateMany(
      { contractor: contractorId, status: "scheduled" },
      { $set: { status: "cancelled", cancelledAt: now } }
    );
  }

  // Stack from the old end date (or now if somehow already lapsed).
  const start = existing.endDate > now ? existing.endDate : now;
  const end = addMonths(start, plan.durationMonths);
  const sub = await ContractorSubscription.create({
    contractor: contractorId,
    plan: plan._id,
    planCode: plan.code,
    tier: plan.tier,
    status: "active",
    startDate: start,
    endDate: end,
    amountPaise: plan.pricePaise,
    currency: plan.currency,
    transaction: transaction?._id || transaction
  });
  await refreshContractorCache(contractorId);
  return sub;
};

/**
 * Mark a created transaction as captured and activate its subscription. Idempotent:
 * an already-captured transaction simply returns its linked subscription. Shared by
 * the /verify endpoint and the Razorpay webhook so both settle identically.
 */
export const captureAndActivate = async (transaction, { paymentId, signature } = {}) => {
  if (transaction.status === "captured") {
    // Return the subscription linked to this specific transaction (may be "scheduled").
    const subscription =
      (transaction.relatedSubscription
        ? await ContractorSubscription.findById(transaction.relatedSubscription)
        : null) || (await getActiveSubscription(transaction.party));
    return { transaction, subscription, alreadyCaptured: true };
  }

  const plan = await SubscriptionPlan.findById(transaction.relatedPlan);
  if (!plan) throw new Error("Plan not found for transaction");

  if (paymentId) transaction.gatewayPaymentId = paymentId;
  if (signature) transaction.gatewaySignature = signature;
  transaction.status = "captured";
  transaction.capturedAt = new Date();
  transaction.invoiceNumber =
    transaction.invoiceNumber || `BO-${new Date().getFullYear()}-${String(transaction._id).slice(-8).toUpperCase()}`;
  await transaction.save();

  const subscription = await activateSubscription({ contractorId: transaction.party, plan, transaction });
  transaction.relatedSubscription = subscription._id;
  await transaction.save();
  return { transaction, subscription, alreadyCaptured: false };
};

/**
 * Cron sweep: activate scheduled subscriptions whose startDate has passed.
 * Runs after expireSubscriptions so a plan that expired at midnight triggers
 * its queued successor in the same cron run.
 */
export const activateScheduledSubscriptions = async () => {
  const now = new Date();
  const due = await ContractorSubscription.find({
    status: "scheduled",
    startDate: { $lte: now }
  }).select("_id contractor tier planCode");

  if (due.length === 0) return { activated: 0, activatedContractors: 0 };

  await ContractorSubscription.updateMany(
    { _id: { $in: due.map((d) => d._id) } },
    { $set: { status: "active" } }
  );

  const contractorIds = [...new Set(due.map((d) => String(d.contractor)))];
  for (const id of contractorIds) {
    await refreshContractorCache(id);
    await createNotification({
      userId: id,
      type: "subscription",
      title: "Your subscription is now active",
      body: "Your queued plan has been activated. Enjoy unlimited bidding!",
      link: "/membership"
    });
  }
  return { activated: due.length, activatedContractors: contractorIds.length };
};

/**
 * Cron sweep: flip active subscriptions whose endDate has passed to "expired",
 * reset each affected contractor's cache, notify them, then immediately activate
 * any scheduled subscriptions whose startDate has now passed.
 */
export const expireSubscriptions = async () => {
  const now = new Date();
  const due = await ContractorSubscription.find({ status: "active", endDate: { $lte: now } }).select(
    "_id contractor"
  );

  let expired = 0;
  if (due.length > 0) {
    await ContractorSubscription.updateMany(
      { _id: { $in: due.map((d) => d._id) } },
      { $set: { status: "expired" } }
    );
    expired = due.length;

    const contractorIds = [...new Set(due.map((d) => String(d.contractor)))];
    for (const id of contractorIds) {
      await refreshContractorCache(id);
      await createNotification({
        userId: id,
        type: "subscription",
        title: "Subscription expired",
        body: "Your BuildOra subscription has expired. Renew to keep receiving leads and bidding.",
        link: "/plans"
      });
    }
  }

  // Immediately activate any scheduled plans whose start date has now passed
  // (including ones queued behind the plans we just expired).
  const { activated, activatedContractors } = await activateScheduledSubscriptions();

  return { expired, activated, activatedContractors };
};

/**
 * Cron job: notify contractors whose active subscription expires in 7 / 3 / 1
 * days. Dedup via `remindersSent` so re-runs never send the same window twice.
 */
export const sendRenewalReminders = async () => {
  const now = new Date();
  const windows = [7, 3, 1];
  let sent = 0;

  for (const days of windows) {
    const start = new Date(now);
    start.setDate(start.getDate() + days);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    const subs = await ContractorSubscription.find({
      status: "active",
      endDate: { $gte: start, $lte: end },
      remindersSent: { $ne: days }
    });

    for (const sub of subs) {
      await createNotification({
        userId: sub.contractor,
        type: "subscription",
        title: `Subscription expiring in ${days} day${days === 1 ? "" : "s"}`,
        body: `Your ${sub.tier} plan expires soon. Renew now to keep your leads and bidding access.`,
        link: "/plans"
      });
      sub.remindersSent.push(days);
      await sub.save();
      sent += 1;
    }
  }
  return { reminders: sent };
};
