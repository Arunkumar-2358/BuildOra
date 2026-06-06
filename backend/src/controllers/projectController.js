import Bid from "../models/Bid.js";
import Notification from "../models/Notification.js";
import Project from "../models/Project.js";
import { getSettings } from "../services/settingsService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { setPaymentStatusForProject } from "../utils/payments.js";
import { isPremiumProject } from "../utils/premium.js";
import { uploadMany } from "../utils/uploadToCloudinary.js";
import { inviteTopMatches } from "./discoveryController.js";

// Build a GeoJSON point from form lat/lng if both are valid numbers.
const buildGeo = (lat, lng) => {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return { type: "Point", coordinates: [longitude, latitude] };
  }
  return undefined;
};

export const createProject = asyncHandler(async (req, res) => {
  const images = await uploadMany(req.files, "buildora/projects");
  // High-budget / premium-category projects are flagged exclusive to premium contractors.
  const settings = await getSettings();
  const visibility = isPremiumProject(settings, { budget: req.body.budget, category: req.body.category })
    ? "premium"
    : "public";
  const project = await Project.create({
    customer: req.user._id,
    title: req.body.title,
    description: req.body.description,
    budget: req.body.budget,
    location: req.body.location,
    state: req.body.state,
    pincode: req.body.pincode,
    geo: buildGeo(req.body.lat, req.body.lng),
    category: req.body.category,
    timeline: req.body.timeline,
    images,
    visibility
  });

  // Auto-invite the best-matching contractors to bid (non-blocking on failure).
  try {
    await inviteTopMatches(project, 5);
  } catch (error) {
    console.error("Auto-invite failed:", error.message);
  }

  res.status(201).json(await project.populate("customer", "name city profileImage"));
});

export const getProjects = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 9, 30);
  const skip = (page - 1) * limit;
  const filter = {};

  if (req.query.mine === "true") filter.customer = req.user._id;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.city) filter.location = new RegExp(req.query.city, "i");
  if (req.query.search) filter.$text = { $search: req.query.search };

  // Premium-only projects are exclusive: hide them from contractors without an
  // active premium subscription. Customers (their own projects), premium
  // contractors, and admins are unaffected.
  if (req.query.mine !== "true" && req.user.role === "contractor" && !req.user.contractorProfile?.isPremium) {
    filter.visibility = { $ne: "premium" };
  }

  const [projects, total] = await Promise.all([
    Project.find(filter)
      .populate("customer", "name city profileImage")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Project.countDocuments(filter)
  ]);

  res.json({
    projects,
    pagination: {
      page,
      pages: Math.ceil(total / limit),
      total
    }
  });
});

export const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id).populate("customer", "name city phone profileImage");

  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  const bids = await Bid.find({ project: project._id })
    .populate("contractor", "name city phone profileImage contractorProfile")
    .sort({ createdAt: -1 });

  res.json({ project, bids });
});

export const updateProjectStatus = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  if (project.customer.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Only the project owner can update status");
  }

  project.status = req.body.status;
  await project.save();

  // Settle the linked payment when the project reaches a terminal state.
  await setPaymentStatusForProject(project._id, project.status);

  res.json(project);
});

export const saveProject = asyncHandler(async (req, res) => {
  const isSaved = req.user.savedProjects.some((id) => id.toString() === req.params.id);
  req.user.savedProjects = isSaved
    ? req.user.savedProjects.filter((id) => id.toString() !== req.params.id)
    : [...req.user.savedProjects, req.params.id];
  await req.user.save();

  res.json({ savedProjects: req.user.savedProjects });
});

export const notifyProjectOwner = async ({ project, bid }) => {
  await Notification.create({
    user: project.customer,
    type: "bid",
    title: "New quotation received",
    body: `A contractor submitted a quotation for ${project.title}.`,
    link: `/projects/${project._id}?bid=${bid._id}`
  });
};
