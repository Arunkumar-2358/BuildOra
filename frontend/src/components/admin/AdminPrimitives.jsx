import { Inbox } from "lucide-react";
import { cn } from "../../lib/cn";

// Headline metric card — shared across admin, membership and earnings.
export const StatCard = ({ icon: Icon, label, value, sub, tone = "accent" }) => {
  const tones = {
    accent: "bg-brand/10 text-brand",
    success: "bg-success/10 text-success",
    warn: "bg-spark/10 text-spark",
    danger: "bg-brand/10 text-brand"
  };
  return (
    <div className="premium-card rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
        {Icon && (
          <span className={cn("grid h-9 w-9 place-items-center rounded-lg", tones[tone] || tones.accent)}>
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>
      <p className="mt-3 font-display text-3xl font-bold tracking-tight text-content tabular">{value}</p>
      {sub && <p className="mt-1 text-xs text-subtle">{sub}</p>}
    </div>
  );
};

// Colored status pill, shared across approvals / payments / users / billing.
const badgeTones = {
  pending: "bg-spark/10 text-spark",
  approved: "bg-success/10 text-success",
  active: "bg-success/10 text-success",
  completed: "bg-success/10 text-success",
  captured: "bg-success/10 text-success",
  rejected: "bg-brand/10 text-brand",
  suspended: "bg-brand/10 text-brand",
  refunded: "bg-brand/10 text-brand",
  failed: "bg-brand/10 text-brand",
  default: "bg-surface-2 text-muted"
};

export const StatusBadge = ({ status }) => (
  <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold capitalize", badgeTones[status] || badgeTones.default)}>
    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
    {String(status || "—").replace(/_/g, " ")}
  </span>
);

export const Skeleton = ({ className = "" }) => <div className={cn("skeleton rounded-xl", className)} />;

export const EmptyState = ({ icon: Icon = Inbox, title, message }) => (
  <div className="premium-card grid place-items-center rounded-2xl p-10 text-center">
    <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand/10 text-brand">
      <Icon className="h-6 w-6" />
    </span>
    <p className="mt-3 font-bold text-content">{title}</p>
    {message && <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>}
  </div>
);

export const ErrorState = ({ message, onRetry }) => (
  <div className="premium-card grid place-items-center rounded-2xl p-10 text-center">
    <p className="font-bold text-brand">Something went wrong</p>
    <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="mt-4 rounded-lg border border-line-strong px-4 py-2 text-sm font-bold text-content transition hover:bg-surface-2">
        Retry
      </button>
    )}
  </div>
);
