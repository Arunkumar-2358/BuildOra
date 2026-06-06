import express from "express";
import {
  deleteNotification,
  getNotifications,
  getUnreadCount,
  markAllRead,
  markRead
} from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All notification endpoints require authentication.
// Users can only access their own notifications (enforced in controller queries).
router.use(protect);

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.put("/mark-all-read", markAllRead);
router.put("/:id/read", markRead);
router.delete("/:id", deleteNotification);

export default router;
