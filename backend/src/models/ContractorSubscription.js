import mongoose from "mongoose";

/**
 * A contractor's subscription instance. Every purchase/renewal creates a row, so
 * this collection doubles as the subscription history. The contractor's *current*
 * standing is denormalized onto User.contractorProfile for fast bid-gating; this
 * collection remains the source of truth.
 *
 * Active subscription = status "active" AND endDate > now. The expiry cron flips
 * lapsed rows to "expired" and resets the User cache.
 */
const contractorSubscriptionSchema = new mongoose.Schema(
  {
    contractor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: "SubscriptionPlan" },
    planCode: { type: String, required: true },
    tier: { type: String, enum: ["pro", "premium"], required: true },

    status: {
      type: String,
      // "scheduled" = paid, queued to start after the current active plan expires (downgrade protection).
      enum: ["pending", "active", "scheduled", "expired", "cancelled"],
      default: "pending"
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },

    amountPaise: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    transaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },

    autoRenew: { type: Boolean, default: false },
    cancelledAt: Date,
    // Day-windows already reminded (e.g. [7, 3]) so the cron never double-notifies.
    remindersSent: { type: [Number], default: [] }
  },
  { timestamps: true }
);

// Active-subscription lookup + per-contractor history (newest first).
contractorSubscriptionSchema.index({ contractor: 1, status: 1, endDate: -1 });
// Cron expiry sweep: find active subs whose endDate has passed.
contractorSubscriptionSchema.index({ status: 1, endDate: 1 });

const ContractorSubscription = mongoose.model("ContractorSubscription", contractorSubscriptionSchema);

export default ContractorSubscription;
