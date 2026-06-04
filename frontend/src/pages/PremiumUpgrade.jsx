import { Check, Crown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { PlanCard } from "../components/PlanCard";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { checkoutAndVerify, fetchMySubscription, fetchPlans } from "../services/subscriptions";

const DURATIONS = [
  { months: 1, label: "Monthly" },
  { months: 3, label: "Quarterly" },
  { months: 6, label: "Semi-Annual" },
  { months: 12, label: "Annual" }
];

const BENEFITS = [
  "Bid on exclusive premium & high-budget projects (₹10L+)",
  "Priority placement in search & contractor listings",
  "Premium badge on your profile",
  "Higher recommendation ranking & more auto-invites",
  "Everything in Pro — unlimited bids & lead notifications"
];

export const PremiumUpgrade = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, refreshMe } = useAuth();
  const [plans, setPlans] = useState([]);
  const [me, setMe] = useState(null);
  const [months, setMonths] = useState(12);
  const [busy, setBusy] = useState("");

  useEffect(() => {
    fetchPlans().then(setPlans).catch(() => toast.error("Could not load plans"));
    fetchMySubscription().then(setMe).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const premiumPlans = useMemo(() => plans.filter((p) => p.tier === "premium"), [plans]);
  const selected = premiumPlans.find((p) => p.durationMonths === months);

  const subscribe = async (plan) => {
    setBusy(plan.code);
    try {
      const prefill = user ? { name: user.name, email: user.email, contact: user.phone } : undefined;
      const result = await checkoutAndVerify(plan.code, { prefill });
      await refreshMe();
      toast.success("Premium activated");
      navigate("/payment/success", { state: { transaction: result.transaction, subscription: result.subscription } });
    } catch (err) {
      if (err.code === "PAYMENT_CANCELLED") {
        toast.info("Payment cancelled — no charge was made.");
      } else {
        navigate("/payment/failed", {
          state: { reason: err.response?.data?.message || err.message, code: err.code }
        });
      }
    } finally {
      setBusy("");
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="overflow-hidden rounded-2xl bg-brand-gradient p-8 text-white shadow-glow">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-semibold">
          <Crown className="h-4 w-4 text-gold" /> BuildOra Premium
        </span>
        <h1 className="mt-4 text-3xl font-extrabold md:text-4xl">Win bigger projects</h1>
        <p className="mt-3 max-w-2xl text-white/75">
          Unlock exclusive high-budget leads, priority visibility, and a premium badge that wins customer trust.
        </p>
      </div>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {BENEFITS.map((b) => (
          <li key={b} className="premium-card flex items-start gap-2 rounded-xl p-4 text-sm text-content">
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" /> {b}
          </li>
        ))}
      </ul>

      {me?.isPremium ? (
        <div className="premium-card mt-8 rounded-2xl p-6 text-center">
          <Crown className="mx-auto h-8 w-8 text-gold" />
          <p className="mt-2 text-lg font-extrabold text-content">You're a Premium member</p>
          <p className="text-sm text-muted">Manage your plan from the membership page.</p>
          <Button as={Link} to="/membership" variant="secondary" className="mt-4">
            Go to membership
          </Button>
        </div>
      ) : (
        <>
          <div className="mx-auto mt-8 flex w-fit gap-1 rounded-full border border-line-strong bg-surface p-1">
            {DURATIONS.map((d) => (
              <button
                key={d.months}
                onClick={() => setMonths(d.months)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                  months === d.months ? "bg-brand-gradient text-white shadow-glow" : "text-muted hover:text-content"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
          <div className="mx-auto mt-8 max-w-sm">
            {selected ? (
              <PlanCard plan={selected} onSubscribe={subscribe} busy={busy === selected.code} featured current={false} />
            ) : (
              <p className="text-center text-muted">Loading plans…</p>
            )}
          </div>
        </>
      )}
    </main>
  );
};
