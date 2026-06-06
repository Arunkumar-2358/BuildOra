import mongoose from "mongoose";

/**
 * Materialized monthly revenue rollup, refreshed by the `revenue-rollup` cron.
 * Lets dashboards and trend views read precomputed numbers instead of aggregating
 * the full Transaction/Payment history on every request — the path to scale.
 * All money fields are rupees.
 */
const revenueReportSchema = new mongoose.Schema(
  {
    month: { type: String, required: true, unique: true }, // "YYYY-MM"
    subscriptionRevenue: { type: Number, default: 0 },
    commissionRevenue: { type: Number, default: 0 },
    premiumRevenue: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    newSubscriptions: { type: Number, default: 0 },
    activeSubscriptions: { type: Number, default: 0 },
    mrr: { type: Number, default: 0 },
    arr: { type: Number, default: 0 },
    byCategory: { type: [mongoose.Schema.Types.Mixed], default: [] }, // [{ category, commission }]
    byCity: { type: [mongoose.Schema.Types.Mixed], default: [] }, // [{ city, commission }]
    generatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const RevenueReport = mongoose.model("RevenueReport", revenueReportSchema);

export default RevenueReport;
