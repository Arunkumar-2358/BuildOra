import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadMany } from "../utils/uploadToCloudinary.js";

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
  const { name, phone, city, businessName, experience, services, pricingRange, bio } = req.body;

  user.name = name ?? user.name;
  user.phone = phone ?? user.phone;
  user.city = city ?? user.city;

  if (req.files?.profileImage?.[0]) {
    const [profileImage] = await uploadMany(req.files.profileImage, "buildora/profiles");
    user.profileImage = profileImage;
  }

  if (user.role === "contractor") {
    const portfolioImages = req.files?.portfolioImages
      ? await uploadMany(req.files.portfolioImages, "buildora/portfolio")
      : [];

    user.contractorProfile = {
      ...user.contractorProfile?.toObject?.(),
      businessName,
      experience,
      services: typeof services === "string" ? services.split(",").map((item) => item.trim()) : services,
      pricingRange,
      bio,
      portfolioImages: [...(user.contractorProfile?.portfolioImages || []), ...portfolioImages]
    };
  }

  await user.save();
  res.json(user);
});

export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await (await import("../models/Notification.js")).default
    .find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(30);

  res.json(notifications);
});
