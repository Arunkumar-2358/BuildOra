import { CalendarClock, CreditCard, Crown, Sparkles, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ErrorState, StatCard, StatusBadge } from "../components/admin/AdminPrimitives";
import { Button } from "../components/Button";
import { fetchMySubscription, fetchMyTransactions, rupees } from "../services/subscriptions";
import { currency, shortDate } from "../utils/format";

const titleCase = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export const MySubscription = () => {
  const [data, setData] = useState(null);
  const [txns, setTxns] = useState([]);
  const [error, setError] = useState("");

  const load = () => {
    setError("");
    setData(null);
    fetchMySubscription()
      .then(setData)
      .catch((err) => setError(err.response?.data?.message || "Couldn't load your membership. Is the API running?"));
    fetchMyTransactions().then(setTxns).catch(() => {});
  };

  useEffect(load, []);

  if (error) return <main className="mx-auto max-w-5xl px-4 py-10"><ErrorState message={error} onRetry={load} /></main>;
  if (!data) return <main className="mx-auto max-w-5xl px-4 py-10 text-muted">Loading…</main>;

  const { tier, status, remainingDays, expiresAt, freeBidsUsed, freeBidQuota, isPremium, history } = data;
  const isActive = status === "active" && tier !== "free";
  const left = Math.max((freeBidQuota || 0) - (freeBidsUsed || 0), 0);
  const captured = txns.filter((t) => t.status === "captured").length;

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-content">Membership</h1>
          <p className="text-muted">Manage your BuildOra subscription and billing.</p>
        </div>
        <Button as={Link} to="/plans">
          <Sparkles className="h-4 w-4" /> {isActive ? "Change plan" : "Upgrade"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={isPremium ? Crown : Zap}
          label="Current plan"
          value={isActive ? titleCase(tier) : "Free"}
          tone={isActive ? "accent" : "warn"}
          sub={isActive ? "Active" : `${left} of ${freeBidQuota} free bids left`}
        />
        <StatCard
          icon={CalendarClock}
          label="Days remaining"
          value={isActive ? remainingDays : "—"}
          tone={isActive && remainingDays <= 7 ? "warn" : "accent"}
          sub={expiresAt ? `Expires ${shortDate(expiresAt)}` : "No active plan"}
        />
        <StatCard icon={CreditCard} label="Payments" value={captured} tone="success" sub="Completed transactions" />
      </div>

      {isActive && !isPremium && (
        <div className="premium-card flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5 ring-1 ring-amber-500/30">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-gold">
              <Crown className="h-5 w-5" />
            </span>
            <div>
              <p className="font-extrabold text-content">Upgrade to Premium</p>
              <p className="text-sm text-muted">Unlock exclusive high-budget projects, priority ranking, and a premium badge.</p>
            </div>
          </div>
          <Button as={Link} to="/premium" variant="secondary">Explore Premium</Button>
        </div>
      )}

      {isActive && remainingDays <= 7 && (
        <div className="premium-card rounded-2xl p-5 ring-1 ring-amber-500/40">
          <p className="font-bold text-amber-400">Renewal reminder</p>
          <p className="mt-1 text-sm text-muted">
            Your {tier} plan expires in {remainingDays} day{remainingDays === 1 ? "" : "s"}. Renew now to keep
            receiving leads and bidding.
          </p>
          <Button as={Link} to="/plans" className="mt-3">
            Renew now
          </Button>
        </div>
      )}

      <section className="premium-card overflow-hidden rounded-2xl">
        <div className="border-b border-line/60 px-5 py-4">
          <h2 className="font-extrabold text-content">Subscription history</h2>
        </div>
        {history?.length ? (
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line/60 text-xs uppercase text-muted">
                <tr>
                  <th className="px-5 py-3 font-bold">Plan</th>
                  <th className="px-5 py-3 font-bold">Period</th>
                  <th className="px-5 py-3 text-right font-bold">Amount</th>
                  <th className="px-5 py-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h._id} className="border-b border-line/40 last:border-0 hover:bg-surface-2/40">
                    <td className="px-5 py-3 font-semibold text-content">{h.plan?.name || h.planCode}</td>
                    <td className="px-5 py-3 text-muted">
                      {shortDate(h.startDate)} → {shortDate(h.endDate)}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-content">{currency(rupees(h.amountPaise))}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={h.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-muted">
            No subscriptions yet.{" "}
            <Link to="/plans" className="font-bold text-accent">
              Browse plans →
            </Link>
          </p>
        )}
      </section>

      <section className="premium-card overflow-hidden rounded-2xl">
        <div className="border-b border-line/60 px-5 py-4">
          <h2 className="font-extrabold text-content">Payment history</h2>
        </div>
        {txns.length ? (
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line/60 text-xs uppercase text-muted">
                <tr>
                  <th className="px-5 py-3 font-bold">Invoice</th>
                  <th className="px-5 py-3 font-bold">Plan</th>
                  <th className="px-5 py-3 font-bold">Date</th>
                  <th className="px-5 py-3 text-right font-bold">Amount</th>
                  <th className="px-5 py-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {txns.map((t) => (
                  <tr key={t._id} className="border-b border-line/40 last:border-0 hover:bg-surface-2/40">
                    <td className="px-5 py-3 font-mono text-xs text-muted">{t.invoiceNumber || `#${t._id.slice(-6)}`}</td>
                    <td className="px-5 py-3 capitalize text-content">{t.relatedPlan?.name || t.purpose}</td>
                    <td className="px-5 py-3 text-muted">{shortDate(t.createdAt)}</td>
                    <td className="px-5 py-3 text-right font-bold text-content">{currency(rupees(t.amountPaise))}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={t.status === "captured" ? "completed" : t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-muted">No payments yet.</p>
        )}
      </section>
    </main>
  );
};
