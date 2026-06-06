import mongoose from "mongoose";

/**
 * Platform-wide revenue configuration. A single document (the "singleton")
 * holds the knobs an admin can tune without a redeploy: the commission rate,
 * the free-bid trial quota, and the premium-project thresholds. Read this
 * through settingsService (cached) rather than querying the collection directly.
 */
const platformSettingsSchema = new mongoose.Schema(
  {
    // A fixed key guarantees a single settings document (find/upsert by key).
    key: { type: String, default: "platform", unique: true },

    // Commission taken from each completed project (0.03 = 3%).
    commissionRate: { type: Number, default: 0.03, min: 0, max: 1 },

    // Hybrid model: free bids a contractor gets before they must subscribe.
    freeBidQuota: { type: Number, default: 2, min: 0 },

    // Premium-only project rules (enforced in Phase 3).
    premiumMinBudget: { type: Number, default: 1000000 }, // ₹10,00,000
    premiumCategories: { type: [String], default: ["commercial"] },

    currency: { type: String, default: "INR" }
  },
  { timestamps: true }
);

// Fetch the singleton, creating it with defaults on first access.
platformSettingsSchema.statics.getSettings = async function getSettings() {
  return this.findOneAndUpdate(
    { key: "platform" },
    { $setOnInsert: { key: "platform" } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const PlatformSettings = mongoose.model("PlatformSettings", platformSettingsSchema);

export default PlatformSettings;
