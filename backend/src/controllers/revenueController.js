import { getContractorEarnings, getRevenueOverview } from "../services/revenueService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// GET /api/revenue/admin — platform-wide revenue analytics (subscriptions, commissions, premium).
export const getAdminRevenue = asyncHandler(async (req, res) => {
  res.json(await getRevenueOverview());
});

// GET /api/revenue/me — the authenticated contractor's earnings.
export const getMyEarnings = asyncHandler(async (req, res) => {
  res.json(await getContractorEarnings(req.user._id));
});
