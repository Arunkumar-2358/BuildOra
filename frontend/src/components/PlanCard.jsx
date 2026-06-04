import { Check, Crown, Zap } from "lucide-react";
import { rupees } from "../services/subscriptions";
import { currency } from "../utils/format";
import { Button } from "./Button";

// Reusable pricing card used on the Plans and Premium-upgrade pages.
export const PlanCard = ({ plan, onSubscribe, busy, current, featured }) => {
  const perMonth = rupees(plan.pricePaise) / plan.durationMonths;
  const savings = rupees(plan.basePricePaise - plan.pricePaise);
  const isPremium = plan.tier === "premium";
  const Icon = isPremium ? Crown : Zap;

  return (
    <div className={`premium-card relative flex flex-col rounded-2xl p-6 ${featured ? "ring-2 ring-primary shadow-glow" : ""}`}>
      {plan.discountPercent > 0 && (
        <span className="absolute right-4 top-4 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-success">
          Save {plan.discountPercent}%
        </span>
      )}

      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${isPremium ? "bg-amber-500/10 text-gold" : "bg-primary/10 text-accent"}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-lg font-extrabold text-content">{plan.name}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {plan.tier} · {plan.durationMonths} mo
          </p>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-4xl font-extrabold text-content">{currency(rupees(plan.pricePaise))}</p>
        <p className="mt-1 text-sm text-muted">
          {currency(perMonth)}/mo
          {savings > 0 && <span className="ml-2 text-subtle line-through">{currency(rupees(plan.basePricePaise))}</span>}
        </p>
      </div>

      <ul className="mt-5 flex-1 space-y-2.5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-muted">
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" /> {f}
          </li>
        ))}
      </ul>

      <Button
        className="mt-6 w-full"
        variant={featured ? "primary" : "secondary"}
        disabled={busy || current}
        onClick={() => onSubscribe(plan)}
      >
        {current ? "Current plan" : busy ? "Processing…" : `Subscribe — ${currency(rupees(plan.pricePaise))}`}
      </Button>
    </div>
  );
};
