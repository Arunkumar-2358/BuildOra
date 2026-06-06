import { AlertTriangle, ArrowRight, Crown, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "../lib/cn";
import { fetchMySubscription } from "../services/subscriptions";
import { Progress } from "./ui/Progress";

/**
 * Compact subscription banner for the contractor dashboard. Self-fetches the
 * contractor's standing and shows either remaining paid days (+ renewal nudge)
 * or remaining free-trial bids (+ upgrade CTA). Renders nothing until loaded.
 */
export const SubscriptionGate = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchMySubscription().then(setData).catch(() => {});
  }, []);

  if (!data) return null;

  const { tier, status, remainingDays, freeBidsUsed, freeBidQuota, isPremium } = data;
  const isActive = status === "active" && (tier === "pro" || tier === "premium");

  if (isActive) {
    const expiring = remainingDays <= 7;
    const Icon = isPremium ? Crown : Zap;
    return (
      <div className={cn("premium-card flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5", expiring && "ring-1 ring-spark/40")}>
        <div className="flex items-center gap-3">
          <span className={cn("grid h-11 w-11 place-items-center rounded-xl", isPremium ? "bg-spark/10 text-spark" : "bg-brand/10 text-brand")}>
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="font-bold capitalize text-content">{tier} membership active</p>
            <p className={cn("text-sm", expiring ? "font-semibold text-spark" : "text-muted")}>
              {remainingDays} day{remainingDays === 1 ? "" : "s"} remaining{expiring ? " · renew soon" : ""}
            </p>
          </div>
        </div>
        <Link to="/membership" className="inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline">
          Manage <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const left = Math.max((freeBidQuota || 0) - (freeBidsUsed || 0), 0);
  const exhausted = left === 0;
  const expired = status === "expired";

  return (
    <div className={cn("premium-card rounded-2xl p-5", (exhausted || expired) && "ring-1 ring-spark/40")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-spark/10 text-spark">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <p className="font-bold text-content">
              {expired ? "Your subscription expired" : `${left} of ${freeBidQuota} free bids left`}
            </p>
            <p className="text-sm text-muted">
              {exhausted || expired
                ? "Subscribe to Pro for unlimited bidding & premium leads."
                : "Upgrade anytime for unlimited bids and premium projects."}
            </p>
          </div>
        </div>
        <Link
          to="/plans"
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-glow transition hover:-translate-y-0.5"
        >
          View plans <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {!expired && freeBidQuota > 0 && (
        <Progress className="mt-4" tone="spark" value={Math.min((freeBidsUsed / freeBidQuota) * 100, 100)} />
      )}
    </div>
  );
};
