import { Inbox } from "lucide-react";

// Headline metric card.
export const StatCard = ({ icon: Icon, label, value, sub, tone = "accent" }) => {
  const tones = {
    accent: "bg-primary/10 text-accent",
    success: "bg-emerald-500/10 text-success",
    warn: "bg-amber-500/10 text-amber-400",
    danger: "bg-red-500/10 text-red-400"
  };
  return (
    <div className="premium-card rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
        {Icon && (
          <span className={`grid h-9 w-9 place-items-center rounded-lg ${tones[tone] || tones.accent}`}>
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>
      <p className="mt-3 text-3xl font-extrabold text-content">{value}</p>
      {sub && <p className="mt-1 text-xs text-subtle">{sub}</p>}
    </div>
  );
};

// Colored status pill, shared across approvals / payments / users.
const badgeTones = {
  pending: "bg-amber-500/10 text-amber-400",
  approved: "bg-emerald-500/10 text-success",
  active: "bg-emerald-500/10 text-success",
  completed: "bg-emerald-500/10 text-success",
  rejected: "bg-red-500/10 text-red-400",
  suspended: "bg-red-500/10 text-red-400",
  refunded: "bg-red-500/10 text-red-400",
  default: "bg-surface-2 text-muted"
};

export const StatusBadge = ({ status }) => (
  <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold capitalize ${badgeTones[status] || badgeTones.default}`}>
    {String(status || "—").replace(/_/g, " ")}
  </span>
);

export const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded-xl bg-surface-2/70 ${className}`} />
);

export const EmptyState = ({ icon: Icon = Inbox, title, message }) => (
  <div className="premium-card grid place-items-center rounded-2xl p-10 text-center">
    <span className="grid h-12 w-12 place-items-center rounded-xl bg-surface-2 text-muted">
      <Icon className="h-6 w-6" />
    </span>
    <p className="mt-3 font-extrabold text-content">{title}</p>
    {message && <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>}
  </div>
);

export const ErrorState = ({ message, onRetry }) => (
  <div className="premium-card grid place-items-center rounded-2xl p-10 text-center">
    <p className="font-extrabold text-red-400">Something went wrong</p>
    <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="mt-4 rounded-lg border border-line-strong px-4 py-2 text-sm font-bold text-content hover:bg-surface-2">
        Retry
      </button>
    )}
  </div>
);
