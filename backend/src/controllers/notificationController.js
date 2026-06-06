import Notification from "../models/Notification.js";
import { emitUnreadCount } from "../services/notificationService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// GET /api/notifications
// Supports: ?page, ?limit, ?unread=true, ?type=<type>, ?search=<term>
export const getNotifications = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const skip = (page - 1) * limit;

  const filter = { user: req.user._id };
  if (req.query.unread === "true") filter.isRead = false;
  if (req.query.type) filter.type = req.query.type;
  if (req.query.search) {
    const rx = new RegExp(req.query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ title: rx }, { body: rx }];
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user._id, isRead: false })
  ]);

  res.json({
    notifications,
    pagination: { page, pages: Math.ceil(total / limit), total },
    unreadCount
  });
});

// GET /api/notifications/unread-count
export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ user: req.user._id, isRead: false });
  res.json({ count });
});

// PUT /api/notifications/:id/read
export const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    res.status(404);
    throw new Error("Notification not found");
  }

  res.json(notification);
});

// PUT /api/notifications/mark-all-read
export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  // Push the definitive count back so all open tabs sync
  await emitUnreadCount(req.user._id);
  res.json({ success: true });
});

// DELETE /api/notifications/:id
export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });

  if (!notification) {
    res.status(404);
    throw new Error("Notification not found");
  }

  res.json({ success: true });
});
