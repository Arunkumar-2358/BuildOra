import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        // Existing types (kept for backward compat)
        "bid",
        "bid-status",
        "message",
        "project",
        "review",
        "subscription",
        // New
        "payment",
        "admin",
      ],
      required: true
    },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    link: { type: String, default: "" },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Primary access: user's feed, newest first
notificationSchema.index({ user: 1, createdAt: -1 });
// Unread filter — covers the bell-count query
notificationSchema.index({ user: 1, isRead: 1 });
// Auto-delete after 90 days to prevent unbounded collection growth
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7_776_000 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
