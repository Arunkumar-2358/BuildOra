import Notification from "../models/Notification.js";
import { getIO } from "../sockets/ioInstance.js";

/**
 * Persist a notification and push it to the user's socket room immediately.
 * Safe to call even when the user is offline — the DB write always succeeds;
 * the socket emit is a no-op when the room has no active listeners.
 */
export const createNotification = async ({ userId, type, title, body = "", link = "" }) => {
  const notification = await Notification.create({ user: userId, type, title, body, link });

  const io = getIO();
  io?.to(userId.toString()).emit("notification:new", {
    _id: notification._id,
    type,
    title,
    body,
    link,
    isRead: false,
    createdAt: notification.createdAt
  });

  return notification;
};

/**
 * Push an updated unread count to the user's socket room.
 * Call this after bulk operations (mark-all-read) that the client
 * can't easily reconcile on its own.
 */
export const emitUnreadCount = async (userId) => {
  const count = await Notification.countDocuments({ user: userId, isRead: false });
  const io = getIO();
  io?.to(userId.toString()).emit("notification:unread_count", { count });
  return count;
};
