import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlanCard } from "../components/PlanCard";
import { Container } from "../components/ui/Container";
import { SectionHeading } from "../components/ui/SectionHeading";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { checkoutAndVerify, fetchMySubscription, fetchPlans } from "../services/subscriptions";

const DURATIONS = [
  { value: 1, label: "Monthly" },
  { value: 3, label: "Quarterly" },
  { value: 6, label: "Semi-Annual" },
  { value: 12, label: "Annual" }
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
    fetchPlans().then(setPlans).catch(() => toast.error("Could not load plans"));
    fetchMySubscription().then(setMe).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const result = await checkoutAndVerify(plan.code, { prefill });
      await refreshMe();
      toast.success(`${plan.name} activated`);
      navigate("/payment/success", { state: { transaction: result.transaction, subscription: result.subscription } });
    } catch (err) {
      if (err.code === "PAYMENT_CANCELLED") {
        toast.info("Payment cancelled — no charge was made.");
      } else {
        navigate("/payment/failed", { state: { reason: err.response?.data?.message || err.message, code: err.code } });
      }
    } finally {
      setBusy("");
    }
  };

  const freeLeft = me ? Math.max((me.freeBidQuota || 0) - (me.freeBidsUsed || 0), 0) : null;

  return (
    <Container className="max-w-5xl py-10">
      <SectionHeading
        align="center"
        eyebrow="Membership"
        title={<>Choose your <span className="brand-text-gradient">BuildOra</span> plan</>}
        subtitle="Unlimited bids, premium leads, and higher visibility. Cancel anytime."
        className="mx-auto"
      />

      {me && me.tier === "free" && (
        <p className="mx-auto mt-5 w-fit rounded-full bg-spark/10 px-4 py-1.5 text-sm font-semibold text-spark">
          {freeLeft} of {me.freeBidQuota} free bids remaining
        </p>
      )}

      <div className="mt-8 flex justify-center">
        <SegmentedControl options={DURATIONS} value={months} onChange={setMonths} />
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
    </Container>
  );
};
