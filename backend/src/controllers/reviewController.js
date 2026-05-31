import mongoose from "mongoose";
import Bid from "../models/Bid.js";
import Notification from "../models/Notification.js";
import Project from "../models/Project.js";
import Review, { REVIEW_TAGS } from "../models/Review.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadMany } from "../utils/uploadToCloudinary.js";

const EDIT_WINDOW_MS = 48 * 60 * 60 * 1000;
const REPLY_EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

const reviewerSelect = "name profileImage role";

// Multipart form fields arrive as strings — parse JSON-ish values defensively.
const parseMaybeJson = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const sanitizeSubRatings = (raw) => {
  const parsed = parseMaybeJson(raw, {}) || {};
  const result = {};
  ["quality", "communication", "timeliness", "value"].forEach((key) => {
    const num = Number(parsed[key]);
    if (Number.isInteger(num) && num >= 1 && num <= 5) result[key] = num;
  });
  return Object.keys(result).length ? result : undefined;
};

const sanitizeTags = (raw) => {
  const parsed = parseMaybeJson(raw, []);
  if (!Array.isArray(parsed)) return [];
  return [...new Set(parsed.filter((tag) => REVIEW_TAGS.includes(tag)))];
};

// Denormalize the contractor's headline rating onto their user profile.
// Recalculated from source documents on every mutation — never user editable.
const recalcContractorRating = async (contractorId) => {
  const [summary] = await Review.aggregate([
    { $match: { contractor: new mongoose.Types.ObjectId(contractorId), status: "visible" } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$overallRating" },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  await User.findByIdAndUpdate(contractorId, {
    "contractorProfile.rating": summary ? Math.round(summary.averageRating * 10) / 10 : 0,
    "contractorProfile.reviewsCount": summary ? summary.totalReviews : 0
  });
};

// POST /api/reviews
export const createReview = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.body.project);

  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  // 1. Authenticated user must be the project's client.
  if (project.customer.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Only the project owner can leave a review");
  }

  // 2. Project must be completed.
  if (project.status !== "completed") {
    res.status(403);
    throw new Error("You can only review after the project is completed");
  }

  // Derive the awarded contractor from the accepted bid.
  const acceptedBid = await Bid.findOne({ project: project._id, status: "accepted" });
  if (!acceptedBid) {
    res.status(400);
    throw new Error("This project has no awarded contractor to review");
  }

  // 3. Reviewer cannot be the contractor.
  if (acceptedBid.contractor.toString() === req.user._id.toString()) {
    res.status(403);
    throw new Error("Contractors cannot review their own work");
  }

  const photos = (await uploadMany(req.files, "buildora/reviews")).slice(0, 5);

  try {
    const review = await Review.create({
      project: project._id,
      contractor: acceptedBid.contractor,
      customer: req.user._id,
      overallRating: Number(req.body.overallRating),
      subRatings: sanitizeSubRatings(req.body.subRatings),
      tags: sanitizeTags(req.body.tags),
      wouldHireAgain:
        req.body.wouldHireAgain === undefined ? null : parseMaybeJson(req.body.wouldHireAgain, null),
      reviewText: req.body.reviewText,
      photos,
      isVerifiedProject: true,
      editableUntil: new Date(Date.now() + EDIT_WINDOW_MS)
    });

    await recalcContractorRating(acceptedBid.contractor);

    await Notification.create({
      user: acceptedBid.contractor,
      type: "review",
      title: "You have a new review",
      body: `${req.user.name} left you a ${review.overallRating}-star review on ${project.title}.`,
      link: `/projects/${project._id}`
    });

    res.status(201).json(await review.populate("customer", reviewerSelect));
  } catch (error) {
    if (error.code === 11000) {
      res.status(409);
      throw new Error("You have already reviewed this project");
    }
    throw error;
  }
});

// PATCH /api/reviews/:id
export const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review || review.status === "deleted") {
    res.status(404);
    throw new Error("Review not found");
  }

  if (review.customer.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You can only edit your own review");
  }

  if (review.editableUntil && review.editableUntil.getTime() < Date.now()) {
    res.status(403);
    throw new Error("The 48-hour edit window for this review has closed");
  }

  if (req.body.overallRating !== undefined) review.overallRating = Number(req.body.overallRating);
  if (req.body.reviewText !== undefined) review.reviewText = req.body.reviewText;
  if (req.body.subRatings !== undefined) review.subRatings = sanitizeSubRatings(req.body.subRatings);
  if (req.body.tags !== undefined) review.tags = sanitizeTags(req.body.tags);
  if (req.body.wouldHireAgain !== undefined) {
    review.wouldHireAgain = parseMaybeJson(req.body.wouldHireAgain, null);
  }

  await review.save();
  await recalcContractorRating(review.contractor);

  res.json(await review.populate("customer", reviewerSelect));
});

// GET /api/reviews/contractor/:contractorId
export const getContractorReviews = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 5, 20);
  const skip = (page - 1) * limit;

  const filter = { contractor: req.params.contractorId, status: "visible" };
  if (req.query.rating) filter.overallRating = Number(req.query.rating);

  const sortMap = {
    newest: { createdAt: -1 },
    helpful: { helpfulCount: -1, createdAt: -1 },
    lowest: { overallRating: 1, createdAt: -1 }
  };
  const sort = sortMap[req.query.sort] || sortMap.newest;

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate("customer", reviewerSelect)
      .populate("project", "title category")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter)
  ]);

  res.json({
    reviews,
    pagination: { page, pages: Math.ceil(total / limit), total }
  });
});

// GET /api/reviews/contractor/:contractorId/summary
export const getRatingSummary = asyncHandler(async (req, res) => {
  const contractorId = new mongoose.Types.ObjectId(req.params.contractorId);

  const [agg] = await Review.aggregate([
    { $match: { contractor: contractorId, status: "visible" } },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: "$overallRating" },
        five: { $sum: { $cond: [{ $eq: ["$overallRating", 5] }, 1, 0] } },
        four: { $sum: { $cond: [{ $eq: ["$overallRating", 4] }, 1, 0] } },
        three: { $sum: { $cond: [{ $eq: ["$overallRating", 3] }, 1, 0] } },
        two: { $sum: { $cond: [{ $eq: ["$overallRating", 2] }, 1, 0] } },
        one: { $sum: { $cond: [{ $eq: ["$overallRating", 1] }, 1, 0] } },
        qualitySum: { $sum: "$subRatings.quality" },
        qualityCount: { $sum: { $cond: [{ $gt: ["$subRatings.quality", 0] }, 1, 0] } },
        communicationSum: { $sum: "$subRatings.communication" },
        communicationCount: { $sum: { $cond: [{ $gt: ["$subRatings.communication", 0] }, 1, 0] } },
        timelinessSum: { $sum: "$subRatings.timeliness" },
        timelinessCount: { $sum: { $cond: [{ $gt: ["$subRatings.timeliness", 0] }, 1, 0] } },
        valueSum: { $sum: "$subRatings.value" },
        valueCount: { $sum: { $cond: [{ $gt: ["$subRatings.value", 0] }, 1, 0] } },
        hireAgainYes: { $sum: { $cond: [{ $eq: ["$wouldHireAgain", true] }, 1, 0] } },
        hireAgainAnswered: { $sum: { $cond: [{ $ne: ["$wouldHireAgain", null] }, 1, 0] } }
      }
    }
  ]);

  if (!agg) {
    return res.json({
      averageRating: 0,
      totalReviews: 0,
      breakdown: { five: 0, four: 0, three: 0, two: 0, one: 0 },
      avgSubRatings: null,
      topTags: [],
      wouldHireAgainPercent: null
    });
  }

  // Sub-ratings only surface when at least 3 reviews provided them (per spec).
  const subAvg = (sum, count) => (count >= 3 ? Math.round((sum / count) * 10) / 10 : null);
  const avgSubRatings =
    agg.qualityCount >= 3 ||
    agg.communicationCount >= 3 ||
    agg.timelinessCount >= 3 ||
    agg.valueCount >= 3
      ? {
          quality: subAvg(agg.qualitySum, agg.qualityCount),
          communication: subAvg(agg.communicationSum, agg.communicationCount),
          timeliness: subAvg(agg.timelinessSum, agg.timelinessCount),
          value: subAvg(agg.valueSum, agg.valueCount)
        }
      : null;

  const tagAgg = await Review.aggregate([
    { $match: { contractor: contractorId, status: "visible" } },
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 6 }
  ]);

  res.json({
    averageRating: Math.round(agg.averageRating * 100) / 100,
    totalReviews: agg.totalReviews,
    breakdown: {
      five: agg.five,
      four: agg.four,
      three: agg.three,
      two: agg.two,
      one: agg.one
    },
    avgSubRatings,
    topTags: tagAgg.map((tag) => ({ tag: tag._id, count: tag.count })),
    wouldHireAgainPercent: agg.hireAgainAnswered
      ? Math.round((agg.hireAgainYes / agg.hireAgainAnswered) * 100)
      : null
  });
});

// GET /api/reviews/project/:projectId
export const getProjectReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({
    project: req.params.projectId,
    status: { $ne: "deleted" }
  })
    .populate("customer", reviewerSelect)
    .populate("contractor", "name profileImage contractorProfile");

  res.json(review || null);
});

// GET /api/reviews/me
export const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ customer: req.user._id, status: { $ne: "deleted" } })
    .populate("contractor", "name profileImage contractorProfile")
    .populate("project", "title category")
    .sort({ createdAt: -1 });

  res.json(reviews);
});

// POST /api/reviews/:id/helpful
export const toggleHelpful = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review || review.status !== "visible") {
    res.status(404);
    throw new Error("Review not found");
  }

  const userId = req.user._id.toString();
  const hasVoted = review.helpfulVoters.some((id) => id.toString() === userId);

  review.helpfulVoters = hasVoted
    ? review.helpfulVoters.filter((id) => id.toString() !== userId)
    : [...review.helpfulVoters, req.user._id];
  review.helpfulCount = review.helpfulVoters.length;

  await review.save();

  res.json({ helpfulCount: review.helpfulCount, hasVoted: !hasVoted });
});

// POST /api/reviews/:id/reply
export const replyToReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review || review.status === "deleted") {
    res.status(404);
    throw new Error("Review not found");
  }

  if (review.contractor.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You can only reply to reviews about your own work");
  }

  if (review.reply?.text) {
    res.status(409);
    throw new Error("You have already replied to this review");
  }

  const now = Date.now();
  review.reply = {
    text: req.body.replyText,
    createdAt: new Date(now),
    updatedAt: new Date(now),
    editableUntil: new Date(now + REPLY_EDIT_WINDOW_MS)
  };

  await review.save();

  await Notification.create({
    user: review.customer,
    type: "review",
    title: "Contractor replied to your review",
    body: `${req.user.name} responded to your review.`,
    link: `/projects/${review.project}`
  });

  res.status(201).json(await review.populate("customer", reviewerSelect));
});

// PATCH /api/reviews/:id/reply
export const updateReply = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review || review.status === "deleted") {
    res.status(404);
    throw new Error("Review not found");
  }

  if (review.contractor.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You can only edit your own reply");
  }

  if (!review.reply?.text) {
    res.status(404);
    throw new Error("There is no reply to edit");
  }

  if (review.reply.editableUntil && review.reply.editableUntil.getTime() < Date.now()) {
    res.status(403);
    throw new Error("The reply editing window has closed");
  }

  review.reply.text = req.body.replyText;
  review.reply.updatedAt = new Date();
  await review.save();

  res.json(await review.populate("customer", reviewerSelect));
});
