import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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

export const SubscriptionPlans = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, refreshMe } = useAuth();
  const [plans, setPlans] = useState([]);
  const [me, setMe] = useState(null);
  const [months, setMonths] = useState(1);
  const [busy, setBusy] = useState("");

  useEffect(() => {
    fetchPlans()
      .then(setPlans)
      .catch(() => toast.error("Could not load plans"));
    fetchMySubscription()
      .then(setMe)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pro first (left), Premium second (right, featured) for the selected duration.
  const visible = useMemo(
    () =>
      plans
        .filter((p) => p.durationMonths === months)
        .sort((a, b) => (a.tier === "pro" ? 0 : 1) - (b.tier === "pro" ? 0 : 1)),
    [plans, months]
  );

  const subscribe = async (plan) => {
    setBusy(plan.code);
    try {
      const prefill = user ? { name: user.name, email: user.email, contact: user.phone } : undefined;
      // Handles mock (instant) and Razorpay (widget) checkout behind one call.
      const result = await checkoutAndVerify(plan.code, { prefill });
      await refreshMe();
      toast.success(`${plan.name} activated`);
      navigate("/payment/success", {
        state: { transaction: result.transaction, subscription: result.subscription }
      });
    } catch (err) {
      // Cancelling is not an error — nudge gently and stay on the page.
      if (err.code === "PAYMENT_CANCELLED") {
        toast.info("Payment cancelled — no charge was made.");
      } else {
        // Declined payment or post-payment verification problem → failure page.
        navigate("/payment/failed", {
          state: { reason: err.response?.data?.message || err.message, code: err.code }
        });
      }
    } finally {
      setBusy("");
    }
  };

  const freeLeft = me ? Math.max((me.freeBidQuota || 0) - (me.freeBidsUsed || 0), 0) : null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-content md:text-4xl">
          Choose your <span className="brand-text-gradient">BuildOra</span> plan
        </h1>
        <p className="mt-3 text-muted">Unlimited bids, premium leads, and higher visibility. Cancel anytime.</p>
      </div>

      {me && me.tier === "free" && (
        <p className="mx-auto mt-4 w-fit rounded-full bg-amber-500/10 px-4 py-1.5 text-sm font-semibold text-amber-400">
          {freeLeft} of {me.freeBidQuota} free bids remaining
        </p>
      )}

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

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {visible.map((plan) => (
          <PlanCard
            key={plan.code}
            plan={plan}
            onSubscribe={subscribe}
            busy={busy === plan.code}
            current={Boolean(me && me.tier === plan.tier && me.status === "active")}
            featured={plan.tier === "premium"}
          />
        ))}
        {!visible.length && <p className="col-span-full text-center text-muted">Loading plans…</p>}
      </div>

      <p className="mt-8 text-center text-xs text-subtle">
        Secure payments · 3% platform commission only on completed projects · GST invoices provided
      </p>
    </main>
  );
};
