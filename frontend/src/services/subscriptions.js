import { api } from "./api";

// Thin wrappers around the subscription API. Money is exchanged with the server
// as integer paise; use rupees() before formatting with currency().
export const rupees = (paise) => (paise || 0) / 100;

export const fetchPlans = () => api.get("/subscriptions/plans").then((r) => r.data);
export const fetchMySubscription = () => api.get("/subscriptions/me").then((r) => r.data);
export const fetchMyTransactions = () => api.get("/subscriptions/transactions").then((r) => r.data);
export const startCheckout = (planCode) => api.post(`/subscriptions/${planCode}/checkout`).then((r) => r.data);
export const verifyPayment = (payload) => api.post("/subscriptions/verify", payload).then((r) => r.data);

// Load the Razorpay Checkout script once (only needed in real-gateway mode).
const loadRazorpay = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load the payment gateway"));
    document.body.appendChild(s);
  });

// Error carrying a machine-readable `code` so callers can tell a user-cancelled
// checkout from a genuine failure from a post-payment verification problem.
const codedError = (message, code) => Object.assign(new Error(message), { code });

/**
 * Run the full checkout for a plan and resolve with the verify result.
 * - mock provider → backend returns a ready handshake we confirm immediately.
 * - razorpay     → open Razorpay Checkout and verify the widget's signed response.
 * Both paths hit the same /verify endpoint, so activation is identical.
 *
 * Rejects with a coded error:
 *   PAYMENT_CANCELLED            — user dismissed the checkout (no charge)
 *   PAYMENT_FAILED               — card/UPI/bank declined inside the widget
 *   PAYMENT_VERIFICATION_FAILED  — paid, but the backend couldn't verify it
 */
export const checkoutAndVerify = async (planCode, { prefill } = {}) => {
  const { order, keyId, plan, mockHandshake } = await startCheckout(planCode);

  if (mockHandshake) {
    return verifyPayment(mockHandshake);
  }

  await loadRazorpay();
  return new Promise((resolve, reject) => {
    // Razorpay can fire both `payment.failed` and `ondismiss`; settle only once
    // so a genuine failure reason isn't overwritten by the later dismiss event.
    let settled = false;
    const settle = (fn, value) => {
      if (settled) return;
      settled = true;
      fn(value);
    };

    const rzp = new window.Razorpay({
      key: keyId,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      name: "BuildOra",
      description: plan?.name || "Subscription",
      prefill: prefill || {},
      notes: { planCode },
      theme: { color: "#2563EB" },
      handler: (resp) =>
        verifyPayment({
          orderId: resp.razorpay_order_id,
          paymentId: resp.razorpay_payment_id,
          signature: resp.razorpay_signature
        })
          .then((data) => settle(resolve, data))
          .catch((err) =>
            settle(
              reject,
              codedError(
                err.response?.data?.message ||
                  "We couldn't verify your payment. If money was deducted it will be reconciled or refunded automatically.",
                "PAYMENT_VERIFICATION_FAILED"
              )
            )
          ),
      modal: { ondismiss: () => settle(reject, codedError("Payment cancelled", "PAYMENT_CANCELLED")) }
    });

    // Card declined, UPI/bank failure, etc. Settle with the reason FIRST (so the
    // subsequent close()'s dismiss event is a no-op and can't mask it), then close
    // the widget so the caller can route to the failure UI cleanly.
    rzp.on("payment.failed", (resp) => {
      settle(reject, codedError(resp?.error?.description || "Your payment could not be processed.", "PAYMENT_FAILED"));
      rzp.close();
    });

    rzp.open();
  });
};
