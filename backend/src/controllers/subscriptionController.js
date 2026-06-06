import ContractorSubscription from "../models/ContractorSubscription.js";
import SubscriptionPlan from "../models/SubscriptionPlan.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import { getPaymentProvider } from "../services/paymentProviders/index.js";
import { getSettings } from "../services/settingsService.js";
import {
  captureAndActivate,
  getActiveSubscription,
  remainingDays
} from "../services/subscriptionService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// GET /api/subscriptions/plans — public catalog (Pro & Premium × durations).
export const getPlans = asyncHandler(async (req, res) => {
  const plans = await SubscriptionPlan.find({ isActive: true }).sort({ tier: 1, sortOrder: 1 });
  res.json(plans);
});

// GET /api/subscriptions/me — current standing for the contractor's dashboard.
export const getMySubscription = asyncHandler(async (req, res) => {
  const [active, scheduled, settings, history] = await Promise.all([
    getActiveSubscription(req.user._id),
    ContractorSubscription.findOne({ contractor: req.user._id, status: "scheduled" })
      .sort({ startDate: 1 })
      .populate("plan", "name code tier durationMonths"),
    getSettings(),
    ContractorSubscription.find({ contractor: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("plan", "name code tier durationMonths")
  ]);

  const profile = req.user.contractorProfile || {};
  res.json({
    tier: profile.subscriptionTier || "free",
    status: active ? "active" : profile.subscriptionStatus || "none",
    isPremium: Boolean(profile.isPremium),
    expiresAt: active?.endDate || null,
    remainingDays: remainingDays(active?.endDate),
    freeBidsUsed: profile.freeBidsUsed || 0,
    freeBidQuota: settings.freeBidQuota,
    activeSubscription: active,
    scheduledSubscription: scheduled || null,
    history
  });
});

// GET /api/subscriptions/transactions — contractor's payment history.
export const getMyTransactions = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ party: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("relatedPlan", "name code tier");
  res.json(transactions);
});

// POST /api/subscriptions/:planCode/checkout — create a gateway order + Transaction.
// The charged amount is ALWAYS the server-side plan price; any client amount is ignored.
export const checkout = asyncHandler(async (req, res) => {
  const plan = await SubscriptionPlan.findOne({ code: req.params.planCode, isActive: true });
  if (!plan) {
    res.status(404);
    throw new Error("Plan not found");
  }

  const provider = getPaymentProvider();
  const { order, handshake } = await provider.createOrder({
    amountPaise: plan.pricePaise,
    currency: plan.currency,
    receipt: `sub_${req.user._id}_${Date.now()}`,
    notes: { contractorId: String(req.user._id), planCode: plan.code }
  });

  const transaction = await Transaction.create({
    purpose: plan.tier === "premium" ? "premium" : "subscription",
    party: req.user._id,
    amountPaise: plan.pricePaise,
    currency: plan.currency,
    gateway: provider.name,
    gatewayOrderId: order.id,
    relatedPlan: plan._id,
    status: "created"
  });

  res.status(201).json({
    transactionId: transaction._id,
    order,
    keyId: provider.publicKey, // Razorpay Checkout key in production
    plan: { code: plan.code, name: plan.name, tier: plan.tier, pricePaise: plan.pricePaise, currency: plan.currency },
    // Mock-only handshake so the demo "Pay" button can complete instantly.
    mockHandshake: handshake || null
  });
});

// POST /api/subscriptions/verify — verify the gateway signature and activate the plan.
// Idempotent: re-verifying a captured order just returns the active subscription.
export const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, paymentId, signature } = req.body;

  const transaction = await Transaction.findOne({ gatewayOrderId: orderId, party: req.user._id });
  if (!transaction) {
    res.status(404);
    throw new Error("Transaction not found");
  }

  // Verify the gateway signature unless the webhook already settled this order.
  if (transaction.status !== "captured") {
    const provider = getPaymentProvider();
    if (!provider.verifyPayment({ orderId, paymentId, signature })) {
      transaction.status = "failed";
      await transaction.save();
      res.status(400);
      throw new Error("Payment verification failed");
    }
  }

  const { subscription } = await captureAndActivate(transaction, { paymentId, signature });
  // Return the refreshed user so the client can update its cached profile.
  const user = await User.findById(req.user._id).select("-password");
  res.json({ transaction, subscription, user });
});
