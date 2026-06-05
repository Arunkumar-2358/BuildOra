import { ArrowRight, CheckCircle2, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "../components/Button";
import { fetchMySubscription, rupees } from "../services/subscriptions";
import { currency, shortDate } from "../utils/format";

const Row = ({ label, value }) => (
  <div className="flex items-center justify-between">
    <dt className="text-muted">{label}</dt>
    <dd className="font-semibold text-content">{value}</dd>
  </div>
);

export const PaymentSuccess = () => {
  const { state } = useLocation();
  const [fallback, setFallback] = useState(null);

  // Direct visits (no navigation state) still show the current membership.
  useEffect(() => {
    if (!state?.subscription) fetchMySubscription().then(setFallback).catch(() => {});
  }, [state]);

  const sub = state?.subscription;
  const txn = state?.transaction;
  const tier = sub?.tier || fallback?.tier;

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 py-10 text-center">
      <span className="grid h-20 w-20 place-items-center rounded-full bg-success/10 text-success">
        <CheckCircle2 className="h-12 w-12" />
      </span>
      <h1 className="mt-6 text-3xl font-extrabold text-content">Payment successful</h1>
      <p className="mt-2 text-muted">
        {tier ? `Your ${tier} membership is now active.` : "Your subscription is active."}
      </p>

      {(sub || txn) && (
        <div className="premium-card mt-8 w-full rounded-2xl p-6 text-left">
          <div className="flex items-center justify-between border-b border-line/60 pb-4">
            <p className="font-extrabold text-content">Receipt</p>
            {txn?.invoiceNumber && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted">
                <FileText className="h-3.5 w-3.5" /> {txn.invoiceNumber}
              </span>
            )}
          </div>
          <dl className="mt-4 space-y-3 text-sm">
            {sub?.planCode && <Row label="Plan" value={<span className="capitalize">{sub.planCode.replace(/_/g, " ")}</span>} />}
            {txn && <Row label="Amount paid" value={currency(rupees(txn.amountPaise))} />}
            {sub?.endDate && <Row label="Valid until" value={shortDate(sub.endDate)} />}
            {txn?.gatewayPaymentId && (
              <Row label="Payment ID" value={<span className="font-mono text-xs">{txn.gatewayPaymentId}</span>} />
            )}
          </dl>
        </div>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button as={Link} to="/membership" variant="secondary">
          View membership
        </Button>
        <Button as={Link} to="/browse-projects">
          Start bidding <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </main>
  );
};
