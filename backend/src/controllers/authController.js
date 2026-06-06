import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import { sendPasswordResetEmail } from "../services/emailService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateToken } from "../utils/generateToken.js";
import { uploadMany } from "../utils/uploadToCloudinary.js";

const TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

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

/**
 * POST /api/auth/forgot-password
 * Generates a secure reset token and emails it to the user.
 * Always responds with a generic message to prevent email enumeration.
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const GENERIC_RESPONSE = {
    message: "If an account with that email exists, we've sent password reset instructions."
  };

  // Look up by email with reset fields included
  const user = await User.findOne({ email: email?.toLowerCase()?.trim() }).select("+passwordResetToken +passwordResetExpires");

  // Always respond the same way regardless of whether the email exists
  // This prevents attackers from enumerating registered emails.
  if (!user) {
    return res.json(GENERIC_RESPONSE);
  }

  // Generate a cryptographically-secure random token
  const rawToken = crypto.randomBytes(32).toString("hex");
  // Store the SHA-256 hash — raw token only ever lives in the email
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = new Date(Date.now() + TOKEN_EXPIRY_MS);
  await user.save({ validateBeforeSave: false });

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const resetUrl = `${clientUrl}/reset-password/${rawToken}`;

  try {
    await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });
  } catch (err) {
    // Roll back the token so the user can try again
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    console.error("Failed to send reset email:", err.message);
    res.status(500);
    throw new Error("Failed to send reset email. Please try again later.");
  }

  res.json(GENERIC_RESPONSE);
});

/**
 * POST /api/auth/reset-password/:token
 * Validates the reset token and updates the password.
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password || password.length < 8) {
    res.status(400);
    throw new Error("Password must be at least 8 characters");
  }

  // Hash the incoming token so we can look it up safely
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  }).select("+password +passwordResetToken +passwordResetExpires");

  if (!user) {
    res.status(400);
    throw new Error("Invalid or expired reset link. Please request a new one.");
  }

  user.password = password; // pre-save hook will hash this
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Auto-login: return a fresh token so the user lands on their dashboard
  sendAuthResponse(res, user);
});
