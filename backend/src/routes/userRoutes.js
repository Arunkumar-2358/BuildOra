import express from "express";
import {
  getContractors,
  getNotifications,
  getUserById,
  updateProfile
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/contractors", getContractors);
router.get("/notifications", protect, getNotifications);
router.put(
  "/profile",
  protect,
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "portfolioImages", maxCount: 8 }
  ]),
  updateProfile
);
router.get("/:id", protect, getUserById);

export default router;
