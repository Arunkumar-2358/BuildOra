import express from "express";
import { body } from "express-validator";
import rateLimit from "express-rate-limit";
import {
  forgotPassword,
  getMe,
  login,
  register,
  resetPassword
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

// Strict rate limiter for password-reset flows — 5 attempts per 15 min window.
// Prevents brute-force token guessing and email-sending abuse.
const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please wait 15 minutes and try again." }
});

router.post(
  "/register",
  upload.single("profileImage"),
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("role").isIn(["customer", "contractor"]).withMessage("Role must be customer or contractor")
  ],
  validate,
  register
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required")
  ],
  validate,
  login
);

router.get("/me", protect, getMe);

router.post(
  "/forgot-password",
  resetLimiter,
  [body("email").isEmail().withMessage("Valid email is required")],
  validate,
  forgotPassword
);

router.post(
  "/reset-password/:token",
  resetLimiter,
  [
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/[A-Z]/)
      .withMessage("Password must contain at least one uppercase letter")
      .matches(/[0-9]/)
      .withMessage("Password must contain at least one number")
  ],
  validate,
  resetPassword
);

export default router;
