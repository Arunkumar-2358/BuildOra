import mongoose from "mongoose";

/**
 * Catalog of purchasable plans (seeded, not user-created). Prices are stored as
 * integer paise — Razorpay's smallest unit — to avoid floating-point money
 * drift. `basePricePaise` is the un-discounted monthly-equivalent total, used to
 * render the strike-through price and the "save X%" badge on longer durations.
 */
export const PLAN_CODES = [
  "pro_monthly",
  "pro_quarterly",
  "pro_semiannual",
  "pro_annual",
  "premium_monthly",
  "premium_quarterly",
  "premium_semiannual",
  "premium_annual"
];

const subscriptionPlanSchema = new mongoose.Schema(
  {
    code: { type: String, enum: PLAN_CODES, required: true, unique: true },
    name: { type: String, required: true },
    tier: { type: String, enum: ["pro", "premium"], required: true },
    durationMonths: { type: Number, enum: [1, 3, 6, 12], required: true },

    basePricePaise: { type: Number, required: true }, // monthly price × months (pre-discount)
    pricePaise: { type: Number, required: true }, // actual charged price
    discountPercent: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },

    // null = unlimited bids (Pro/Premium). The free-tier limit lives in PlatformSettings.
    bidLimit: { type: Number, default: null },
    features: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

subscriptionPlanSchema.index({ tier: 1, isActive: 1, sortOrder: 1 });

const SubscriptionPlan = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);

export default SubscriptionPlan;
