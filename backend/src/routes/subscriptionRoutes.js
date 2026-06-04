import express from "express";
import { body } from "express-validator";
import {
  checkout,
  getMySubscription,
  getMyTransactions,
  getPlans,
  verifyPayment
} from "../controllers/subscriptionController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

// Public plan catalog.
router.get("/plans", getPlans);

// Contractor subscription dashboard + history.
router.get("/me", protect, authorize("contractor"), getMySubscription);
router.get("/transactions", protect, authorize("contractor"), getMyTransactions);

// Verify a completed payment and activate the subscription.
router.post(
  "/verify",
  protect,
  authorize("contractor"),
  [
    body("orderId").trim().notEmpty().withMessage("orderId is required"),
    body("paymentId").trim().notEmpty().withMessage("paymentId is required"),
    body("signature").trim().notEmpty().withMessage("signature is required")
  ],
  validate,
  verifyPayment
);

// Start checkout for a specific plan.
router.post("/:planCode/checkout", protect, authorize("contractor"), checkout);

export default router;
