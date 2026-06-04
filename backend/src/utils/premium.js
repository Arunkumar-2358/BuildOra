/**
 * A project is "premium-only" (exclusive to premium contractors) when its budget
 * clears the threshold OR its category is flagged premium. Both knobs live in
 * PlatformSettings, so admins can tune the premium funnel without a redeploy.
 * Shared by project creation, the seed backfill, and tests.
 */
export const isPremiumProject = (settings, { budget, category }) =>
  (Number(budget) || 0) >= (settings?.premiumMinBudget ?? Infinity) ||
  (settings?.premiumCategories || []).includes(category);
