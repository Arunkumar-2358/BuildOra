import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  MessageSquare,
  Trash2,
  X
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";
import { cn } from "../lib/cn";
import { ease } from "../lib/motion";

// Maps notification type → icon character / color for the avatar dot
const TYPE_META = {
  bid: { color: "bg-brand/10 text-brand", label: "Bid" },
  "bid-status": { color: "bg-brand/10 text-brand", label: "Bid" },
  message: { color: "bg-blue-500/10 text-blue-500", label: "Msg" },
  project: { color: "bg-spark/10 text-spark", label: "Proj" },
  review: { color: "bg-success/10 text-success", label: "Rev" },
  subscription: { color: "bg-purple-500/10 text-purple-500", label: "Sub" },
  payment: { color: "bg-success/10 text-success", label: "Pay" },
  admin: { color: "bg-ink/10 text-content", label: "Adm" }
};

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const NotifItem = ({ notification, onRead, onDelete }) => {
  const navigate = useNavigate();
  const meta = TYPE_META[notification.type] || TYPE_META.admin;

  const handleClick = () => {
    if (!notification.isRead) onRead(notification._id);
    if (notification.link) navigate(notification.link);
  };

  return (
    <div
      className={cn(
        "group relative flex gap-3 px-4 py-3.5 transition hover:bg-surface-2/60",
        !notification.isRead && "bg-brand/[0.04]"
      )}
    >
      {/* Unread indicator */}
      {!notification.isRead && (
        <span className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-brand" />
      )}

      {/* Type avatar */}
      <div
        className={cn(
          "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[0.6rem] font-bold",
          meta.color
        )}
      >
        {notification.type === "message" ? (
          <MessageSquare className="h-4 w-4" />
        ) : (
          meta.label
        )}
      </div>

      {/* Content */}
      <button
        type="button"
        onClick={handleClick}
        className="min-w-0 flex-1 text-left"
      >
        <p className={cn("text-sm font-semibold leading-snug text-content", notification.isRead && "font-medium text-muted")}>
          {notification.title}
        </p>
        {notification.body && (
          <p className="mt-0.5 line-clamp-2 text-xs text-subtle">{notification.body}</p>
        )}
        <p className="mt-1 text-[0.68rem] text-subtle/80">{timeAgo(notification.createdAt)}</p>
      </button>

      {/* Actions (appear on hover) */}
      <div className="flex shrink-0 items-start gap-1 opacity-0 transition group-hover:opacity-100">
        {!notification.isRead && (
          <button
            type="button"
            onClick={() => onRead(notification._id)}
            aria-label="Mark as read"
            className="grid h-7 w-7 place-items-center rounded-lg text-subtle hover:bg-surface-2 hover:text-brand"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(notification._id)}
          aria-label="Delete notification"
          className="grid h-7 w-7 place-items-center rounded-lg text-subtle hover:bg-brand/10 hover:text-brand"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

// align: "left" | "right" — which edge of the button the dropdown anchors to
// placement: "bottom" | "top" — whether dropdown opens below or above the button
export const NotificationBell = ({ align = "right", placement = "bottom" }) => {
  const { notifications, unreadCount, markRead, markAllRead, deleteNotif } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const preview = notifications.slice(0, 6);
  const hasAny = notifications.length > 0;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
        className={cn(
          "relative grid h-10 w-10 place-items-center rounded-xl border border-line-strong bg-surface text-muted transition",
          "hover:border-brand/40 hover:text-brand",
          open && "border-brand/40 text-brand"
        )}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <motion.span
            key={unreadCount}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[0.6rem] font-bold text-white"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18, ease }}
            className={cn(
              "absolute z-50 w-[360px] overflow-hidden rounded-2xl border border-line bg-surface shadow-lg",
              placement === "top" ? "bottom-full mb-2" : "top-full mt-2",
              align === "left" ? "left-0" : "right-0"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-sm font-bold text-content">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[0.65rem] font-bold text-brand">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted transition hover:bg-surface-2 hover:text-brand"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark all read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid h-7 w-7 place-items-center rounded-lg text-subtle transition hover:bg-surface-2 hover:text-content"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Notification list */}
            <div className="max-h-[400px] divide-y divide-line overflow-y-auto">
              {!hasAny ? (
                <div className="flex flex-col items-center gap-3 py-12">
                  <BellOff className="h-10 w-10 text-subtle" />
                  <p className="text-sm font-medium text-muted">You're all caught up!</p>
                </div>
              ) : (
                preview.map((n) => (
                  <NotifItem
                    key={n._id}
                    notification={n}
                    onRead={markRead}
                    onDelete={deleteNotif}
                  />
                ))
              )}
            </div>

            {/* Footer */}
            {hasAny && (
              <div className="border-t border-line px-4 py-3">
                <button
                  type="button"
                  onClick={() => { setOpen(false); navigate("/notifications"); }}
                  className="w-full rounded-xl bg-surface-2/60 py-2 text-center text-sm font-semibold text-muted transition hover:bg-brand/10 hover:text-brand"
                >
                  View all notifications
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
