import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "../../lib/cn";
import { Counter } from "./Counter";

/**
 * KPI card. Numeric `value` animates via <Counter>; strings render as-is.
 * `delta` (e.g. +12%) renders a colored trend chip.
 */
export const Stat = ({ icon: Icon, label, value, prefix = "", suffix = "", decimals = 0, format, delta, hint, className }) => {
  const isNumber = typeof value === "number";
  const positive = typeof delta === "number" ? delta >= 0 : `${delta}`.trim().startsWith("+");
  return (
    <div className={cn("premium-card rounded-2xl p-5", className)}>
      <div className="flex items-start justify-between">
        {Icon && (
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand/10 text-brand">
            <Icon className="h-5 w-5" />
          </span>
        )}
        {delta != null && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold",
              positive ? "bg-success/10 text-success" : "bg-brand/10 text-brand"
            )}
          >
            {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {typeof delta === "number" ? `${Math.abs(delta)}%` : delta}
          </span>
        )}
      </div>
      <p className="mt-4 text-sm font-semibold text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold tracking-tight text-content tabular">
        {isNumber ? (
          <Counter value={value} prefix={prefix} suffix={suffix} decimals={decimals} format={format} />
        ) : (
          value
        )}
      </p>
      {hint && <p className="mt-1 text-xs text-subtle">{hint}</p>}
    </div>
  );
};
