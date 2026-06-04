import ContractorSubscription from "../models/ContractorSubscription.js";
import Notification from "../models/Notification.js";
import SubscriptionPlan from "../models/SubscriptionPlan.js";
import User from "../models/User.js";
import { getSettings } from "./settingsService.js";

const DAY_MS = 24 * 60 * 60 * 1000;

// Whole days remaining until `date` (0 if absent or already past).
export const remainingDays = (date) => {
  if (!date) return 0;
  const diff = new Date(date).getTime() - Date.now();
  return diff <= 0 ? 0 : Math.ceil(diff / DAY_MS);
};

// A project is premium-only once Phase 3 sets project.visibility = "premium".
// Until then this is always false, so high-budget projects stay open to everyone.
const isPremiumOnly = (project) => project?.visibility === "premium";

// The contractor's current active subscription (status active + not yet expired).
export const getActiveSubscription = (contractorId) =>
  ContractorSubscription.findOne({
    contractor: contractorId,
    status: "active",
    endDate: { $gt: new Date() }
  })
    .sort({ endDate: -1 })
    .populate("plan");

// Mirror a contractor's live subscription onto the User cache used for fast gating.
export const refreshContractorCache = async (contractorId) => {
  const [active, user] = await Promise.all([
    getActiveSubscription(contractorId),
    User.findById(contractorId)
  ]);
  if (!user || user.role !== "contractor") return null;
  if (!user.contractorProfile) user.contractorProfile = {};
  const p = user.contractorProfile;

  if (active) {
    p.subscriptionTier = active.tier; // "pro" | "premium"
    p.subscriptionStatus = "active";
    p.subscriptionExpiresAt = active.endDate;
    p.isPremium = active.tier === "premium";
    p.premiumExpiresAt = active.tier === "premium" ? active.endDate : undefined;
  } else {
    // Lapsed: drop to free but remember that they *had* a subscription.
    p.subscriptionTier = "free";
    p.subscriptionStatus = p.subscriptionStatus === "active" ? "expired" : p.subscriptionStatus;
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

  // Premium-only projects require an active Premium subscription (Phase 3).
  if (isPremiumOnly(project)) {
    if (active && profile.isPremium) return { consumeFreeBid: false };
    throw bidBlock("PREMIUM_REQUIRED", "This is a premium-only project. Upgrade to Premium to place a bid.");
  }

  // Active Pro or Premium → unlimited bidding.
  if (active && (tier === "pro" || tier === "premium")) return { consumeFreeBid: false };

  // Re-submitting/editing an existing bid never consumes a free credit.
  if (!isNewBid) return { consumeFreeBid: false };

  // Free tier: limited trial bids.
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
 * Activate a paid subscription after a verified payment. Stacks onto any
 * remaining paid time (renewals/upgrades never lose days) and supersedes the
 * previous active row so exactly one row stays "active" for clean analytics.
 */
export const activateSubscription = async ({ contractorId, plan, transaction }) => {
  const now = new Date();
  const existing = await getActiveSubscription(contractorId);

  const start = existing && existing.endDate > now ? existing.endDate : now;
  const end = new Date(start);
  end.setMonth(end.getMonth() + plan.durationMonths);

  if (existing) {
    await ContractorSubscription.updateMany(
      { contractor: contractorId, status: "active" },
      { $set: { status: "cancelled", cancelledAt: now } }
    );
  }

  const sub = await ContractorSubscription.create({
    contractor: contractorId,
    plan: plan._id,
    planCode: plan.code,
    tier: plan.tier,
    status: "active",
    startDate: now,
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
 * an already-captured transaction simply returns its active subscription. Shared by
 * the /verify endpoint and the Razorpay webhook so both settle identically — the
 * webhook is the source of truth if the browser drops after payment.
 */
export const captureAndActivate = async (transaction, { paymentId, signature } = {}) => {
  if (transaction.status === "captured") {
    const subscription = await getActiveSubscription(transaction.party);
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
 * Cron sweep: flip active subscriptions whose endDate has passed to "expired",
 * reset each affected contractor's cache, and notify them. Idempotent — safe to
 * run repeatedly and from the serverless cron endpoint.
 */
export const expireSubscriptions = async () => {
  const now = new Date();
  const due = await ContractorSubscription.find({ status: "active", endDate: { $lte: now } }).select(
    "_id contractor"
  );
  if (due.length === 0) return { expired: 0 };

  await ContractorSubscription.updateMany(
    { _id: { $in: due.map((d) => d._id) } },
    { $set: { status: "expired" } }
  );

  const contractorIds = [...new Set(due.map((d) => String(d.contractor)))];
  for (const id of contractorIds) {
    await refreshContractorCache(id);
    await Notification.create({
      user: id,
      type: "subscription",
      title: "Subscription expired",
      body: "Your BuildOra subscription has expired. Renew to keep receiving leads and bidding.",
      link: "/plans"
    });
  }
  return { expired: due.length, contractors: contractorIds.length };
};

/**
 * Cron job: notify contractors whose active subscription expires in 7 / 3 / 1
 * days. Dedup via `remindersSent` so re-runs (or the manual trigger) never send
 * the same window twice.
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
      await Notification.create({
        user: sub.contractor,
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
