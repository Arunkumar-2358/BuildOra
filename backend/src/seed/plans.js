import PlatformSettings from "../models/PlatformSettings.js";
import SubscriptionPlan from "../models/SubscriptionPlan.js";

/**
 * Seed the subscription catalog + platform settings (idempotent — upsert by code).
 * Prices are integer paise. Longer durations get a bigger discount; the monthly
 * price × months is kept as `basePricePaise` so the UI can show the savings.
 */
const PRO_FEATURES = [
  "Unlimited project bids",
  "Real-time lead notifications",
  "Direct chat with customers",
  "Verified contractor badge eligibility"
];

const PREMIUM_FEATURES = [
  "Everything in Pro",
  "Access to exclusive & high-budget projects",
  "Priority placement in search & listings",
  "Premium profile badge",
  "Higher recommendation ranking"
];

const TIERS = {
  pro: { label: "Pro", monthlyPaise: 99900, features: PRO_FEATURES }, // ₹999/mo
  premium: { label: "Premium", monthlyPaise: 249900, features: PREMIUM_FEATURES } // ₹2,499/mo
};

const DURATIONS = [
  { key: "monthly", name: "Monthly", months: 1, discount: 0 },
  { key: "quarterly", name: "Quarterly", months: 3, discount: 10 },
  { key: "semiannual", name: "Semi-Annual", months: 6, discount: 18 },
  { key: "annual", name: "Annual", months: 12, discount: 30 }
];

export const buildPlans = () => {
  const plans = [];
  for (const [tier, cfg] of Object.entries(TIERS)) {
    for (const d of DURATIONS) {
      const basePricePaise = cfg.monthlyPaise * d.months;
      // Round the discounted price to a whole rupee so contractors are charged clean amounts.
      const pricePaise = Math.round((basePricePaise * (1 - d.discount / 100)) / 100) * 100;
      plans.push({
        code: `${tier}_${d.key}`,
        name: `${cfg.label} ${d.name}`,
        tier,
        durationMonths: d.months,
        basePricePaise,
        pricePaise,
        discountPercent: d.discount,
        currency: "INR",
        bidLimit: null, // unlimited for any paid plan
        features: cfg.features,
        isActive: true,
        sortOrder: d.months
      });
    }
  }
  return plans;
};

export const seedPlans = async () => {
  const plans = buildPlans();
  for (const plan of plans) {
    await SubscriptionPlan.findOneAndUpdate(
      { code: plan.code },
      { $set: plan },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  // Ensure the platform-settings singleton exists with its defaults (3% commission, etc.).
  await PlatformSettings.getSettings();
  return plans.length;
};
