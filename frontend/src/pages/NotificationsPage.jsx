import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Filter,
  MessageSquare,
  Search,
  Trash2,
  X
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useNotifications } from "../context/NotificationContext";
import { cn } from "../lib/cn";

const TYPE_LABELS = {
  all: "All",
  bid: "Bids",
  "bid-status": "Bid Status",
  message: "Messages",
  project: "Projects",
  review: "Reviews",
  subscription: "Subscriptions",
  payment: "Payments",
  admin: "System"
};

const TYPE_COLORS = {
  bid: "bg-brand/10 text-brand",
  "bid-status": "bg-brand/10 text-brand",
  message: "bg-blue-500/10 text-blue-500",
  project: "bg-spark/10 text-spark",
  review: "bg-success/10 text-success",
  subscription: "bg-purple-500/10 text-purple-500",
  payment: "bg-success/10 text-success",
  admin: "bg-surface-2 text-muted"
};

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const Skeleton = () => (
  <div className="animate-pulse space-y-3 p-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex gap-3">
        <div className="h-10 w-10 shrink-0 rounded-xl bg-surface-2" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3.5 w-3/4 rounded-lg bg-surface-2" />
          <div className="h-3 w-1/2 rounded-lg bg-surface-2" />
        </div>
      </div>
    ))}
  </div>
);

export const NotificationsPage = () => {
  const { markRead, markAllRead, deleteNotif, unreadCount } = useNotifications();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [unreadOnly, setUnreadOnly] = useState(false);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchPage = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pg, limit: 15 });
      if (unreadOnly) params.set("unread", "true");
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const { data } = await api.get(`/notifications?${params}`);
      setItems(pg === 1 ? data.notifications : (prev) => [...prev, ...data.notifications]);
      setTotal(data.pagination.total);
      setPages(data.pagination.pages);
      setPage(pg);
    } finally {
      setLoading(false);
    }
  }, [unreadOnly, typeFilter, debouncedSearch]);

  // Reset to page 1 when filters change
  useEffect(() => { fetchPage(1); }, [fetchPage]);

  const handleMarkRead = async (id) => {
    await markRead(id);
    setItems((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleDelete = async (id) => {
    await deleteNotif(id);
    setItems((prev) => prev.filter((n) => n._id !== id));
    setTotal((t) => t - 1);
  };

  const handleClick = (notification) => {
    if (!notification.isRead) handleMarkRead(notification._id);
    if (notification.link) navigate(notification.link);
  };

  const types = Object.keys(TYPE_LABELS);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Page header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-content">Notifications</h1>
          <p className="mt-1 text-sm text-muted">
            {total > 0 ? `${total} total · ${unreadCount} unread` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 rounded-xl border border-line-strong bg-surface px-4 py-2 text-sm font-semibold text-muted transition hover:border-brand/40 hover:text-brand"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        )}
      </div>

      {/* Filters bar */}
      <div className="mb-6 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notifications…"
            className="w-full rounded-xl border border-line-strong bg-surface py-2.5 pl-10 pr-10 text-sm text-content outline-none transition placeholder:text-subtle focus:border-brand focus:ring-4 focus:ring-brand/10"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-content"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Type filters + unread toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 shrink-0 text-subtle" />
          <div className="flex flex-wrap gap-1.5">
            {types.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold transition",
                  typeFilter === t
                    ? "bg-brand text-white"
                    : "bg-surface-2 text-muted hover:bg-brand/10 hover:text-brand"
                )}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
          <div className="ml-auto">
            <button
              type="button"
              onClick={() => setUnreadOnly((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition",
                unreadOnly ? "bg-brand text-white" : "bg-surface-2 text-muted hover:bg-brand/10 hover:text-brand"
              )}
            >
              <Bell className="h-3 w-3" />
              Unread only
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        {loading && items.length === 0 ? (
          <Skeleton />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-surface-2">
              <BellOff className="h-8 w-8 text-subtle" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-content">No notifications</p>
              <p className="mt-1 text-sm text-muted">
                {search || typeFilter !== "all" || unreadOnly
                  ? "Try adjusting your filters"
                  : "You're all caught up!"}
              </p>
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {items.map((n, i) => (
              <motion.div
                key={n._id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.18, delay: i < 5 ? i * 0.03 : 0 }}
                className={cn(
                  "group relative flex items-start gap-3 border-b border-line px-4 py-4 last:border-0 transition hover:bg-surface-2/40",
                  !n.isRead && "bg-brand/[0.03]"
                )}
              >
                {/* Unread dot */}
                {!n.isRead && (
                  <span className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-brand" />
                )}

                {/* Avatar */}
                <div
                  className={cn(
                    "mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-bold",
                    TYPE_COLORS[n.type] || "bg-surface-2 text-muted"
                  )}
                >
                  {n.type === "message" ? (
                    <MessageSquare className="h-4 w-4" />
                  ) : (
                    TYPE_LABELS[n.type]?.slice(0, 3) || "---"
                  )}
                </div>

                {/* Text */}
                <button
                  type="button"
                  onClick={() => handleClick(n)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className={cn("text-sm font-semibold text-content", n.isRead && "font-medium text-muted")}>
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="mt-0.5 text-sm text-subtle line-clamp-2">{n.body}</p>
                  )}
                  <p className="mt-1.5 text-[0.7rem] text-subtle/80">{timeAgo(n.createdAt)}</p>
                </button>

                {/* Action buttons */}
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
                  {!n.isRead && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(n._id)}
                      aria-label="Mark as read"
                      title="Mark as read"
                      className="grid h-8 w-8 place-items-center rounded-lg text-subtle hover:bg-surface-2 hover:text-brand"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(n._id)}
                    aria-label="Delete"
                    title="Delete"
                    className="grid h-8 w-8 place-items-center rounded-lg text-subtle hover:bg-brand/10 hover:text-brand"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Load more */}
      {page < pages && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => fetchPage(page + 1)}
            disabled={loading}
            className="rounded-xl border border-line-strong bg-surface px-6 py-2.5 text-sm font-semibold text-muted transition hover:border-brand/40 hover:text-brand disabled:opacity-50"
          >
            {loading ? "Loading…" : `Load more (${total - items.length} remaining)`}
          </button>
        </div>
      )}
    </div>
  );
};
