import Notification from "../models/Notification.js";
import Payment from "../models/Payment.js";
import Project from "../models/Project.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// "Pending" includes contractors who haven't been reviewed yet — including
// legacy accounts created before a verificationStatus was stored.
const PENDING_CONTRACTOR_FILTER = {
  role: "contractor",
  $or: [
    { "contractorProfile.verificationStatus": "pending" },
    { "contractorProfile.verificationStatus": { $exists: false } }
  ]
};

// GET /api/admin/overview — headline counts for the dashboard cards.
export const getOverview = asyncHandler(async (req, res) => {
  const [totalUsers, totalContractors, totalCustomers, activeProjects, completedProjects, pendingApprovals] =
    await Promise.all([
      User.countDocuments({ role: { $ne: "admin" } }),
      User.countDocuments({ role: "contractor" }),
      User.countDocuments({ role: "customer" }),
      Project.countDocuments({ status: { $in: ["open", "in-review", "awarded"] } }),
      Project.countDocuments({ status: "completed" }),
      User.countDocuments(PENDING_CONTRACTOR_FILTER)
    ]);

  const [revenue] = await Payment.aggregate([
    { $match: { status: "completed" } },
    {
      $group: {
        _id: null,
        revenue: { $sum: "$commission" },
        volume: { $sum: "$amount" },
        payouts: { $sum: "$contractorEarning" }
      }
    }
  ]);
  const [pending] = await Payment.aggregate([
    { $match: { status: "pending" } },
    { $group: { _id: null, amount: { $sum: "$amount" }, count: { $sum: 1 } } }
  ]);

  res.json({
    totalUsers,
    totalContractors,
    totalCustomers,
    activeProjects,
    completedProjects,
    pendingApprovals,
    totalRevenue: revenue?.revenue || 0,
    transactionVolume: revenue?.volume || 0,
    contractorPayouts: revenue?.payouts || 0,
    pendingPayments: pending?.amount || 0,
    pendingPaymentsCount: pending?.count || 0
  });
});

// GET /api/admin/contractors?status=pending — verification queue.
export const getContractorQueue = asyncHandler(async (req, res) => {
  let filter = { role: "contractor" };
  if (req.query.status === "pending") {
    filter = PENDING_CONTRACTOR_FILTER;
  } else if (req.query.status) {
    filter["contractorProfile.verificationStatus"] = req.query.status;
  }

  const contractors = await User.find(filter).select("-savedProjects").sort({ createdAt: -1 });
  res.json(contractors);
});

// PATCH /api/admin/contractors/:id/verification — approve/reject/request info/suspend.
export const updateContractorVerification = asyncHandler(async (req, res) => {
  const { action, note } = req.body;
  const user = await User.findById(req.params.id);

  if (!user || user.role !== "contractor") {
    res.status(404);
    throw new Error("Contractor not found");
  }

  if (!user.contractorProfile) user.contractorProfile = {};
  const profile = user.contractorProfile;

  const outcomes = {
    approve: () => {
      profile.verificationStatus = "approved";
      profile.isVerified = true;
      user.status = "active";
    },
    reject: () => {
      profile.verificationStatus = "rejected";
      profile.isVerified = false;
    },
    request_info: () => {
      profile.verificationStatus = "pending";
    },
    suspend: () => {
      profile.verificationStatus = "suspended";
      profile.isVerified = false;
      user.status = "suspended";
    }
  };

  if (!outcomes[action]) {
    res.status(400);
    throw new Error("Invalid action. Use approve, reject, request_info, or suspend.");
  }
  outcomes[action]();
  if (note !== undefined) profile.adminNote = note;

  user.markModified("contractorProfile");
  await user.save();

  const messages = {
    approve: "Your contractor profile has been verified and approved.",
    reject: "Your contractor verification was not approved.",
    request_info: "An admin requested more information for your verification.",
    suspend: "Your contractor account has been suspended."
  };
  await Notification.create({
    user: user._id,
    type: "project",
    title: "Verification update",
    body: note ? `${messages[action]} Note: ${note}` : messages[action],
    link: "/profile"
  });

  res.json(user);
});

// GET /api/admin/users?role=&status=&search=&page= — user management list.
export const getUsers = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const skip = (page - 1) * limit;

  const filter = {};
  filter.role = req.query.role || { $ne: "admin" };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(req.query.search), "i");
    filter.$or = [{ name: rx }, { email: rx }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).select("-savedProjects").sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter)
  ]);

  res.json({ users, pagination: { page, pages: Math.ceil(total / limit), total } });
});

// PATCH /api/admin/users/:id/status — suspend or reactivate an account.
export const updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["active", "suspended"].includes(status)) {
    res.status(400);
    throw new Error("Status must be 'active' or 'suspended'");
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  if (user.role === "admin") {
    res.status(400);
    throw new Error("Admin accounts cannot be modified here");
  }

  user.status = status;
  // Keep a suspended contractor's verification badge consistent.
  if (user.role === "contractor" && user.contractorProfile) {
    if (status === "suspended") user.contractorProfile.verificationStatus = "suspended";
    user.markModified("contractorProfile");
  }
  await user.save();

  res.json(user);
});

// GET /api/admin/payments?status=&page= — payment tracking table + totals.
export const getPayments = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const [payments, total, totalsAgg] = await Promise.all([
    Payment.find(filter)
      .populate("project", "title category")
      .populate("customer", "name email")
      .populate("contractor", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Payment.countDocuments(filter),
    Payment.aggregate([
      {
        $group: {
          _id: "$status",
          amount: { $sum: "$amount" },
          commission: { $sum: "$commission" },
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  const totals = totalsAgg.reduce((acc, row) => ({ ...acc, [row._id]: row }), {});

  res.json({ payments, pagination: { page, pages: Math.ceil(total / limit), total }, totals });
});

// GET /api/admin/analytics — time-series + breakdowns for charts.
export const getAnalytics = asyncHandler(async (req, res) => {
  const byMonth = { format: "%Y-%m", date: "$createdAt" };

  const [userGrowth, revenueGrowth, projectStats, topContractors] = await Promise.all([
    User.aggregate([
      { $match: { role: { $ne: "admin" } } },
      { $group: { _id: { $dateToString: byMonth }, customers: { $sum: { $cond: [{ $eq: ["$role", "customer"] }, 1, 0] } }, contractors: { $sum: { $cond: [{ $eq: ["$role", "contractor"] }, 1, 0] } }, total: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $limit: 12 }
    ]),
    Payment.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: { $dateToString: byMonth }, revenue: { $sum: "$commission" }, volume: { $sum: "$amount" }, transactions: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $limit: 12 }
    ]),
    Project.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    User.find({ role: "contractor" })
      .sort({ "contractorProfile.rating": -1, "contractorProfile.reviewsCount": -1 })
      .limit(8)
      .select("name city contractorProfile.rating contractorProfile.reviewsCount")
  ]);

  res.json({
    userGrowth: userGrowth.map((m) => ({ month: m._id, customers: m.customers, contractors: m.contractors, total: m.total })),
    revenueGrowth: revenueGrowth.map((m) => ({ month: m._id, revenue: m.revenue, volume: m.volume, transactions: m.transactions })),
    projectStats: projectStats.map((p) => ({ status: p._id, count: p.count })),
    topContractors: topContractors.map((c) => ({
      name: c.name,
      city: c.city,
      rating: c.contractorProfile?.rating || 0,
      reviews: c.contractorProfile?.reviewsCount || 0
    }))
  });
});
