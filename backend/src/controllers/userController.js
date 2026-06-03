import Bid from "../models/Bid.js";
import Project from "../models/Project.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadMany } from "../utils/uploadToCloudinary.js";

// Helpers to normalize comma-separated or array inputs from multipart forms.
const toArray = (value) => {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === "string") return value.split(",").map((v) => v.trim()).filter(Boolean);
  return undefined;
};

export const getContractors = asyncHandler(async (req, res) => {
  const filter = { role: "contractor" };
  if (req.query.city) filter.city = new RegExp(req.query.city, "i");
  if (req.query.service) filter["contractorProfile.services"] = new RegExp(req.query.service, "i");

  const contractors = await User.find(filter)
    .select("-savedProjects")
    .sort({ "contractorProfile.rating": -1, createdAt: -1 })
    .limit(12);

  res.json(contractors);
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-savedProjects");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.json(user);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = req.user;
  const {
    name,
    phone,
    city,
    businessName,
    experience,
    services,
    pricingRange,
    bio,
    specialization,
    skills,
    certifications,
    licenseNumber,
    availability,
    state,
    pincode,
    lat,
    lng
  } = req.body;

  user.name = name ?? user.name;
  user.phone = phone ?? user.phone;
  user.city = city ?? user.city;
  user.state = state ?? user.state;
  user.pincode = pincode ?? user.pincode;

  // Update geo coordinates when provided (enables nearby discovery & matching).
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    user.geo = { type: "Point", coordinates: [longitude, latitude] };
  }

  if (req.files?.profileImage?.[0]) {
    const [profileImage] = await uploadMany(req.files.profileImage, "buildora/profiles");
    user.profileImage = profileImage;
  }

  if (user.role === "contractor") {
    const portfolioImages = req.files?.portfolioImages
      ? await uploadMany(req.files.portfolioImages, "buildora/portfolio")
      : [];

    const existing = user.contractorProfile?.toObject?.() || {};
    user.contractorProfile = {
      ...existing,
      businessName,
      experience,
      services: toArray(services) ?? existing.services,
      pricingRange,
      bio,
      // New professional details (verification stays admin-controlled).
      specialization: specialization ?? existing.specialization,
      skills: toArray(skills) ?? existing.skills,
      certifications: toArray(certifications) ?? existing.certifications,
      licenseNumber: licenseNumber ?? existing.licenseNumber,
      availability: availability ?? existing.availability,
      portfolioImages: [...(existing.portfolioImages || []), ...portfolioImages]
    };
  }

  await user.save();
  res.json(user);
});

// Public contractor portfolio: profile + performance metrics + completed work.
export const getContractorPortfolio = asyncHandler(async (req, res) => {
  const contractor = await User.findById(req.params.id).select("-savedProjects");

  if (!contractor || contractor.role !== "contractor") {
    res.status(404);
    throw new Error("Contractor not found");
  }

  // Projects this contractor was awarded (accepted bid) and which completed.
  const acceptedBids = await Bid.find({ contractor: contractor._id, status: "accepted" }).select("project");
  const awardedProjectIds = acceptedBids.map((bid) => bid.project);
  const completedProjects = await Project.find({
    _id: { $in: awardedProjectIds },
    status: "completed"
  })
    .select("title category images budget location updatedAt createdAt")
    .sort({ updatedAt: -1 })
    .limit(12);

  // Response-time proxy: average hours between a project being posted and this
  // contractor submitting a bid on it. Modular — easy to swap for a tracked metric.
  const bids = await Bid.find({ contractor: contractor._id })
    .populate("project", "createdAt")
    .select("createdAt project");
  const responseDiffs = bids
    .filter((bid) => bid.project?.createdAt)
    .map((bid) => (new Date(bid.createdAt) - new Date(bid.project.createdAt)) / 3_600_000)
    .filter((hours) => hours >= 0);
  const responseTimeHours = responseDiffs.length
    ? Math.round((responseDiffs.reduce((a, c) => a + c, 0) / responseDiffs.length) * 10) / 10
    : null;

  const awardedProjects = acceptedBids.length;
  const completedCount = completedProjects.length;

  res.json({
    contractor,
    metrics: {
      averageRating: contractor.contractorProfile?.rating || 0,
      totalReviews: contractor.contractorProfile?.reviewsCount || 0,
      completedProjects: completedCount,
      awardedProjects,
      successRate: awardedProjects ? Math.round((completedCount / awardedProjects) * 100) : null,
      responseTimeHours,
      totalBids: bids.length
    },
    completedProjects
  });
});

export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await (await import("../models/Notification.js")).default
    .find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(30);

  res.json(notifications);
});
