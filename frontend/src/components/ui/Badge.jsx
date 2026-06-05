import { cva } from "class-variance-authority";
import { cn } from "../../lib/cn";

const badge = cva(
  "inline-flex items-center gap-1.5 rounded-full font-semibold capitalize tracking-tight",
  {
    variants: {
      tone: {
        neutral: "bg-surface-2 text-muted",
        brand: "bg-brand/10 text-brand ring-1 ring-inset ring-brand/20",
        spark: "bg-spark/10 text-spark ring-1 ring-inset ring-spark/25",
        success: "bg-success/10 text-success ring-1 ring-inset ring-success/20",
        ink: "bg-ink-900 text-white dark:bg-white/10",
        outline: "border border-line-strong text-muted",
        white: "bg-white/15 text-white ring-1 ring-inset ring-white/20 backdrop-blur"
      },
      size: {
        sm: "px-2 py-0.5 text-[0.68rem]",
        md: "px-3 py-1 text-xs"
      }
    },
    defaultVariants: { tone: "neutral", size: "md" }
  }
);

export const Badge = ({ tone, size, icon: Icon, dot, className, children, ...props }) => (
  <span className={cn(badge({ tone, size }), className)} {...props}>
    {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
    {Icon && <Icon className="h-3.5 w-3.5" />}
    {children}
  </span>
);

// Maps domain status strings to a tone + label so badges stay consistent everywhere.
const STATUS = {
  open: { tone: "success", label: "Open" },
  active: { tone: "success", label: "Active" },
  awarded: { tone: "brand", label: "Awarded" },
  in_progress: { tone: "brand", label: "In progress" },
  pending: { tone: "spark", label: "Pending" },
  closed: { tone: "neutral", label: "Closed" },
  completed: { tone: "ink", label: "Completed" },
  rejected: { tone: "neutral", label: "Rejected" },
  premium: { tone: "spark", label: "Premium" },
  urgent: { tone: "brand", label: "Urgent" }
};

export const StatusPill = ({ status, label, className, ...props }) => {
  const meta = STATUS[status] || { tone: "neutral", label: status };
  return (
    <Badge tone={meta.tone} dot className={cn("capitalize", className)} {...props}>
      {label || meta.label}
    </Badge>
  );
};
