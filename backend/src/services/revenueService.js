import mongoose from "mongoose";
import ContractorSubscription from "../models/ContractorSubscription.js";
import Payment from "../models/Payment.js";
import RevenueReport from "../models/RevenueReport.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";

// Monthly bucket key, matching the existing adminController.getAnalytics pattern.
const MONTH = { format: "%Y-%m", date: "$createdAt" };
// Subscription/premium money is stored in paise (Transaction); commissions are
// stored in rupees (Payment). Everything is returned to the client in rupees.
const toRupees = (paise) => Math.round((paise || 0) / 100);

/**
 * Platform-wide revenue overview for the admin dashboard. Unifies the two
 * revenue ledgers — Transaction (subscription/premium gateway payments, paise)
 * and Payment (project commissions, rupees) — into a single rupee-denominated
 * payload. We deliberately do NOT mirror commissions into Transaction (the
 * Payment collection already is the commission ledger), avoiding double-counting.
 */
export const getRevenueOverview = async () => {
  const now = new Date();

  const [
    activeSubs,
    expiredSubs,
    mrrAgg,
    subRevenueAgg,
    subMonthly,
    commissionTotals,
    commissionMonthly,
    commissionByCategory,
    commissionByCity,
    totalContractors,
    premiumContractors,
    paidContractors,
    premiumRevenueAgg
  ] = await Promise.all([
    ContractorSubscription.countDocuments({ status: "active", endDate: { $gt: now } }),
    ContractorSubscription.countDocuments({ status: "expired" }),
    // MRR = sum of each active subscription's monthly-equivalent (amount / months).
    ContractorSubscription.aggregate([
      { $match: { status: "active", endDate: { $gt: now } } },
      { $lookup: { from: "subscriptionplans", localField: "plan", foreignField: "_id", as: "plan" } },
      { $unwind: "$plan" },
      { $group: { _id: null, mrrPaise: { $sum: { $divide: ["$amountPaise", "$plan.durationMonths"] } } } }
    ]),
    Transaction.aggregate([
      { $match: { status: "captured", purpose: { $in: ["subscription", "premium"] } } },
      { $group: { _id: null, paise: { $sum: "$amountPaise" }, count: { $sum: 1 } } }
    ]),
    Transaction.aggregate([
      { $match: { status: "captured", purpose: { $in: ["subscription", "premium"] } } },
      { $group: { _id: { $dateToString: MONTH }, paise: { $sum: "$amountPaise" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $limit: 12 }
    ]),
    Payment.aggregate([
      { $group: { _id: "$status", commission: { $sum: "$commission" }, volume: { $sum: "$amount" }, count: { $sum: 1 } } }
    ]),
    Payment.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: { $dateToString: MONTH }, commission: { $sum: "$commission" }, volume: { $sum: "$amount" } } },
      { $sort: { _id: 1 } },
      { $limit: 12 }
    ]),
    // Commission split by project category / city via a join to projects.
    Payment.aggregate([
      { $match: { status: "completed" } },
      { $lookup: { from: "projects", localField: "project", foreignField: "_id", as: "project" } },
      { $unwind: "$project" },
      { $group: { _id: "$project.category", commission: { $sum: "$commission" } } },
      { $sort: { commission: -1 } }
    ]),
    Payment.aggregate([
      { $match: { status: "completed" } },
      { $lookup: { from: "projects", localField: "project", foreignField: "_id", as: "project" } },
      { $unwind: "$project" },
      { $group: { _id: "$project.location", commission: { $sum: "$commission" } } },
      { $sort: { commission: -1 } },
      { $limit: 8 }
    ]),
    User.countDocuments({ role: "contractor" }),
    User.countDocuments({ role: "contractor", "contractorProfile.isPremium": true }),
    User.countDocuments({
      role: "contractor",
      "contractorProfile.subscriptionStatus": "active",
      "contractorProfile.subscriptionTier": { $in: ["pro", "premium"] }
    }),
    Transaction.aggregate([
      { $match: { status: "captured", purpose: "premium" } },
      { $group: { _id: null, paise: { $sum: "$amountPaise" } } }
    ])
  ]);

  const byStatus = commissionTotals.reduce((acc, r) => ({ ...acc, [r._id]: r }), {});
  const mrr = toRupees(mrrAgg[0]?.mrrPaise || 0);
  const pct = (n, d) => (d ? Number(((n / d) * 100).toFixed(1)) : 0);

  return {
    subscriptions: {
      active: activeSubs,
      expired: expiredSubs,
      mrr,
      arr: mrr * 12,
      totalRevenue: toRupees(subRevenueAgg[0]?.paise || 0),
      paidTransactions: subRevenueAgg[0]?.count || 0,
      monthly: subMonthly.map((m) => ({ month: m._id, revenue: toRupees(m.paise), count: m.count }))
    },
    commissions: {
      total: byStatus.completed?.commission || 0,
      volume: byStatus.completed?.volume || 0,
      count: byStatus.completed?.count || 0,
      pending: byStatus.pending?.commission || 0,
      monthly: commissionMonthly.map((m) => ({ month: m._id, commission: m.commission, volume: m.volume })),
      byCategory: commissionByCategory.map((c) => ({ category: c._id || "other", commission: c.commission })),
      byCity: commissionByCity.map((c) => ({ city: c._id || "—", commission: c.commission }))
    },
    premium: {
      premiumContractors,
      paidContractors,
      totalContractors,
      premiumConversion: pct(premiumContractors, totalContractors),
      paidConversion: pct(paidContractors, totalContractors),
      premiumRevenue: toRupees(premiumRevenueAgg[0]?.paise || 0)
    }
  };
};

/**
 * A single contractor's earnings, sourced from the Payment (commission) ledger
 * where they are the awarded contractor, plus what they've spent on subscriptions.
 */
export const getContractorEarnings = async (contractorId) => {
  const id = new mongoose.Types.ObjectId(contractorId);

  const [totals, monthly, byCategory, recent, spendAgg] = await Promise.all([
    Payment.aggregate([
      { $match: { contractor: id } },
      { $group: { _id: "$status", earning: { $sum: "$contractorEarning" }, commission: { $sum: "$commission" }, count: { $sum: 1 } } }
    ]),
    Payment.aggregate([
      { $match: { contractor: id, status: "completed" } },
      { $group: { _id: { $dateToString: MONTH }, earning: { $sum: "$contractorEarning" } } },
      { $sort: { _id: 1 } },
      { $limit: 12 }
    ]),
    Payment.aggregate([
      { $match: { contractor: id, status: "completed" } },
      { $lookup: { from: "projects", localField: "project", foreignField: "_id", as: "project" } },
      { $unwind: "$project" },
      { $group: { _id: "$project.category", earning: { $sum: "$contractorEarning" } } },
      { $sort: { earning: -1 } }
    ]),
    Payment.find({ contractor: id }).populate("project", "title category").sort({ createdAt: -1 }).limit(8),
    Transaction.aggregate([
      { $match: { party: id, status: "captured" } },
      { $group: { _id: null, paise: { $sum: "$amountPaise" } } }
    ])
  ]);

  const byStatus = totals.reduce((acc, r) => ({ ...acc, [r._id]: r }), {});

  return {
    totalEarned: byStatus.completed?.earning || 0,
    pendingEarned: byStatus.pending?.earning || 0,
    commissionPaid: byStatus.completed?.commission || 0,
    completedProjects: byStatus.completed?.count || 0,
    subscriptionSpend: toRupees(spendAgg[0]?.paise || 0),
    monthly: monthly.map((m) => ({ month: m._id, earning: m.earning })),
    byCategory: byCategory.map((c) => ({ category: c._id || "other", earning: c.earning })),
    recent: recent.map((p) => ({
      id: p._id,
      project: p.project?.title || "—",
      category: p.project?.category,
      amount: p.amount,
      earning: p.contractorEarning,
      status: p.status,
      date: p.createdAt
    }))
  };
};

// [start, end) UTC bounds for a "YYYY-MM" month key.
const monthRange = (monthKey) => {
  const [y, m] = monthKey.split("-").map(Number);
  return [new Date(Date.UTC(y, m - 1, 1)), new Date(Date.UTC(y, m, 1))];
};

/**
 * Cron job: materialize (upsert) the revenue rollup for a month — current month
 * if none is passed. Reads the Transaction + Payment ledgers once and stores the
 * result in RevenueReport so dashboards/trends can scale without re-aggregating.
 */
export const materializeMonthlyReport = async (monthKey) => {
  const month = monthKey || new Date().toISOString().slice(0, 7);
  const [start, end] = monthRange(month);
  const now = new Date();

  const [subRev, premRev, comTotal, comByCat, comByCity, newSubs, mrrAgg, activeSubs] = await Promise.all([
    Transaction.aggregate([
      { $match: { status: "captured", purpose: { $in: ["subscription", "premium"] }, capturedAt: { $gte: start, $lt: end } } },
      { $group: { _id: null, paise: { $sum: "$amountPaise" } } }
    ]),
    Transaction.aggregate([
      { $match: { status: "captured", purpose: "premium", capturedAt: { $gte: start, $lt: end } } },
      { $group: { _id: null, paise: { $sum: "$amountPaise" } } }
    ]),
    Payment.aggregate([
      { $match: { status: "completed", updatedAt: { $gte: start, $lt: end } } },
      { $group: { _id: null, commission: { $sum: "$commission" } } }
    ]),
    Payment.aggregate([
      { $match: { status: "completed", updatedAt: { $gte: start, $lt: end } } },
      { $lookup: { from: "projects", localField: "project", foreignField: "_id", as: "project" } },
      { $unwind: "$project" },
      { $group: { _id: "$project.category", commission: { $sum: "$commission" } } },
      { $sort: { commission: -1 } }
    ]),
    Payment.aggregate([
      { $match: { status: "completed", updatedAt: { $gte: start, $lt: end } } },
      { $lookup: { from: "projects", localField: "project", foreignField: "_id", as: "project" } },
      { $unwind: "$project" },
      { $group: { _id: "$project.location", commission: { $sum: "$commission" } } },
      { $sort: { commission: -1 } },
      { $limit: 8 }
    ]),
    ContractorSubscription.countDocuments({ createdAt: { $gte: start, $lt: end } }),
    ContractorSubscription.aggregate([
      { $match: { status: "active", endDate: { $gt: now } } },
      { $lookup: { from: "subscriptionplans", localField: "plan", foreignField: "_id", as: "plan" } },
      { $unwind: "$plan" },
      { $group: { _id: null, mrrPaise: { $sum: { $divide: ["$amountPaise", "$plan.durationMonths"] } } } }
    ]),
    ContractorSubscription.countDocuments({ status: "active", endDate: { $gt: now } })
  ]);

  const subscriptionRevenue = toRupees(subRev[0]?.paise || 0);
  const commissionRevenue = comTotal[0]?.commission || 0;
  const mrr = toRupees(mrrAgg[0]?.mrrPaise || 0);

  const doc = {
    month,
    subscriptionRevenue,
    commissionRevenue,
    premiumRevenue: toRupees(premRev[0]?.paise || 0),
    totalRevenue: subscriptionRevenue + commissionRevenue, // premium is part of subscriptionRevenue
    newSubscriptions: newSubs,
    activeSubscriptions: activeSubs,
    mrr,
    arr: mrr * 12,
    byCategory: comByCat.map((c) => ({ category: c._id || "other", commission: c.commission })),
    byCity: comByCity.map((c) => ({ city: c._id || "—", commission: c.commission })),
    generatedAt: new Date()
  };

  return RevenueReport.findOneAndUpdate({ month }, { $set: doc }, { upsert: true, new: true, setDefaultsOnInsert: true });
};

// Stored monthly rollups, newest first (for trend views).
export const getRevenueReports = (limit = 12) => RevenueReport.find().sort({ month: -1 }).limit(limit);
