import express from "express";
import { body } from "express-validator";
import {
  getAnalytics,
  getContractorQueue,
  getOverview,
  getPayments,
  getUsers,
  updateContractorVerification,
  updateUserStatus
} from "../controllers/adminController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

// Every admin route requires an authenticated admin.
router.use(protect, authorize("admin"));

router.get("/overview", getOverview);
router.get("/analytics", getAnalytics);

router.get("/contractors", getContractorQueue);
router.patch(
  "/contractors/:id/verification",
  body("action").isIn(["approve", "reject", "request_info", "suspend"]).withMessage("Invalid action"),
  validate,
  updateContractorVerification
);

router.get("/users", getUsers);
router.patch(
  "/users/:id/status",
  body("status").isIn(["active", "suspended"]).withMessage("Invalid status"),
  validate,
  updateUserStatus
);

router.get("/payments", getPayments);

export default router;
