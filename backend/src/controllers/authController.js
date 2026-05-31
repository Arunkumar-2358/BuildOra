import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateToken } from "../utils/generateToken.js";
import { uploadMany } from "../utils/uploadToCloudinary.js";

const sendAuthResponse = (res, user, statusCode = 200) => {
  const safeUser = user.toObject ? user.toObject() : { ...user };
  delete safeUser.password;

  res.status(statusCode).json({
    token: generateToken(user._id),
    user: safeUser
  });
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, city } = req.body;
  const exists = await User.findOne({ email });

  if (exists) {
    res.status(409);
    throw new Error("Email is already registered");
  }

  let profileImage;
  if (req.file) {
    const [uploaded] = await uploadMany([req.file], "buildora/profiles");
    profileImage = uploaded;
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    phone,
    city,
    profileImage,
    // Contractors enter the verification queue as "pending" on signup.
    ...(role === "contractor" ? { contractorProfile: { verificationStatus: "pending" } } : {})
  });

  sendAuthResponse(res, user, 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  if (user.status === "suspended") {
    res.status(403);
    throw new Error("Your account has been suspended. Please contact support.");
  }

  user.password = undefined;
  sendAuthResponse(res, user);
});

export const getMe = asyncHandler(async (req, res) => {
  res.json(req.user);
});
