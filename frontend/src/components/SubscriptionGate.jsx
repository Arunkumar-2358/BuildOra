import { AlertTriangle, ArrowRight, Crown, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMySubscription } from "../services/subscriptions";

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
      <div className={`premium-card mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5 ${expiring ? "ring-1 ring-amber-500/40" : ""}`}>
        <div className="flex items-center gap-3">
          <span className={`grid h-10 w-10 place-items-center rounded-xl ${isPremium ? "bg-amber-500/10 text-gold" : "bg-primary/10 text-accent"}`}>
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="font-extrabold capitalize text-content">{tier} membership active</p>
            <p className={`text-sm ${expiring ? "font-semibold text-amber-400" : "text-muted"}`}>
              {remainingDays} day{remainingDays === 1 ? "" : "s"} remaining{expiring ? " · renew soon" : ""}
            </p>
          </div>
        </div>
        <Link to="/membership" className="inline-flex items-center gap-1 text-sm font-bold text-accent hover:underline">
          Manage <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const left = Math.max((freeBidQuota || 0) - (freeBidsUsed || 0), 0);
  const exhausted = left === 0;
  const expired = status === "expired";

  return (
    <div className={`premium-card mt-6 rounded-2xl p-5 ${exhausted || expired ? "ring-1 ring-amber-500/40" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-400">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <p className="font-extrabold text-content">
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
          className="inline-flex items-center gap-1 rounded-xl bg-brand-gradient px-4 py-2 text-sm font-bold text-white shadow-glow hover:brightness-110"
        >
          View plans <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {!expired && freeBidQuota > 0 && (
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-brand-gradient transition-all"
            style={{ width: `${Math.min((freeBidsUsed / freeBidQuota) * 100, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};
