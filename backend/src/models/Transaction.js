import mongoose from "mongoose";

/**
 * Gateway-facing payment record and revenue-ledger entry. One row per money
 * movement initiated through a payment provider (subscription purchase, premium
 * upgrade, refund). Amounts are integer paise. `gatewayOrderId` is unique so the
 * verify endpoint and the webhook can both settle the same order idempotently.
 *
 * This is distinct from the `Payment` model, which is the project-commission
 * ledger (3% of a completed project's value).
 */
const transactionSchema = new mongoose.Schema(
  {
    purpose: {
      type: String,
      enum: ["subscription", "premium", "commission_payout", "refund"],
      required: true
    },
    party: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    amountPaise: { type: Number, required: true },
    currency: { type: String, default: "INR" },

    gateway: { type: String, enum: ["razorpay", "stripe", "mock"], required: true },
    gatewayOrderId: { type: String },
    gatewayPaymentId: { type: String },
    gatewaySignature: { type: String },

    status: {
      type: String,
      enum: ["created", "authorized", "captured", "failed", "refunded"],
      default: "created"
    },

    relatedSubscription: { type: mongoose.Schema.Types.ObjectId, ref: "ContractorSubscription" },
    relatedPlan: { type: mongoose.Schema.Types.ObjectId, ref: "SubscriptionPlan" },

    invoiceNumber: { type: String },
    notes: { type: String },
    capturedAt: Date
  },
  { timestamps: true }
);

transactionSchema.index({ party: 1, createdAt: -1 }); // contractor history page
transactionSchema.index({ gatewayOrderId: 1 }, { unique: true, sparse: true }); // idempotent settle
transactionSchema.index({ status: 1, createdAt: -1 }); // admin filtering

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
