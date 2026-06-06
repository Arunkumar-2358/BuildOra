import { mockProvider } from "./mock.js";
import { razorpayConfigured, razorpayProvider } from "./razorpay.js";
import { stripeConfigured, stripeProvider } from "./stripe.js";

/**
 * Payment-provider registry. The active provider is chosen by PAYMENT_PROVIDER,
 * but we fall back to the mock provider whenever the selected gateway's keys are
 * absent — so local dev and demos never break for want of secrets.
 *
 * Every provider implements: createOrder({ amountPaise, currency, receipt, notes })
 * → { order, handshake } and verifyPayment({ orderId, paymentId, signature }).
 */
const providers = {
  mock: mockProvider,
  razorpay: razorpayProvider,
  stripe: stripeProvider
};

const configured = {
  mock: () => true,
  razorpay: razorpayConfigured,
  stripe: stripeConfigured
};

// Surface a config problem as a 503 so /checkout fails loudly instead of silently
// activating a subscription for free.
const configError = (message) => {
  const err = new Error(message);
  err.statusCode = 503;
  err.code = "PAYMENT_PROVIDER_MISCONFIGURED";
  return err;
};

/**
 * Resolve the active payment provider.
 *
 * The mock provider activates subscriptions WITHOUT taking real money, so it is
 * strictly a local-dev convenience. In production we never silently fall back to
 * it: a missing/typo'd gateway key must fail checkout loudly rather than give
 * away free subscriptions. In development we keep the mock fallback so demos work
 * without secrets, but we warn so it's obvious no real charge happened.
 */
export const getPaymentProvider = () => {
  const name = process.env.PAYMENT_PROVIDER || "mock";
  const isProd = process.env.NODE_ENV === "production";

  // mock is never allowed to run in production — it bypasses real payment.
  if (name === "mock" && isProd) {
    throw configError("PAYMENT_PROVIDER=mock is not allowed in production. Configure Razorpay (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET).");
  }

  const provider = providers[name];
  if (!provider) {
    if (isProd) throw configError(`Unknown PAYMENT_PROVIDER "${name}".`);
    console.warn(`[payments] Unknown PAYMENT_PROVIDER "${name}" — falling back to mock (dev only, no real charge).`);
    return mockProvider;
  }

  // Selected a real gateway but its keys are absent.
  if (!configured[name]?.()) {
    if (isProd) {
      throw configError(`Payment provider "${name}" is selected but its API keys are not configured. Refusing to fall back to mock — set the gateway keys.`);
    }
    console.warn(`[payments] "${name}" keys missing — falling back to mock (dev only, no real charge).`);
    return mockProvider;
  }

  return provider;
};
