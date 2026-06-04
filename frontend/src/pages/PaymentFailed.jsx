import { ArrowLeft, RefreshCw, ShieldAlert, XCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "../components/Button";

/**
 * Shown when a subscription payment is declined inside the Razorpay widget, or
 * when the payment succeeded but the backend couldn't verify it. User-cancelled
 * checkouts never land here — those surface as a gentle toast instead.
 */
export const PaymentFailed = () => {
  const { state } = useLocation();
  const reason = state?.reason;
  const verification = state?.code === "PAYMENT_VERIFICATION_FAILED";

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 py-10 text-center">
      <span className="grid h-20 w-20 place-items-center rounded-full bg-red-500/10 text-red-400">
        <XCircle className="h-12 w-12" />
      </span>
      <h1 className="mt-6 text-3xl font-extrabold text-content">
        {verification ? "Payment not verified" : "Payment failed"}
      </h1>
      <p className="mt-2 text-muted">
        {reason || "Your payment could not be completed, so no subscription was activated."}
      </p>

      {verification ? (
        <div className="premium-card mt-8 flex w-full items-start gap-3 rounded-2xl p-5 text-left">
          <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
          <p className="text-sm text-muted">
            If money was deducted, don't worry — our payment webhook reconciles confirmed payments automatically, so
            your plan may activate shortly. Otherwise the amount is auto-refunded by the bank. Check your{" "}
            <Link to="/membership" className="font-bold text-accent">
              membership
            </Link>{" "}
            in a few minutes before retrying.
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-subtle">You were not charged. You can safely try again.</p>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button as={Link} to="/plans">
          <RefreshCw className="h-4 w-4" /> Try again
        </Button>
        <Button as={Link} to="/dashboard" variant="secondary">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Button>
      </div>
    </main>
  );
};
