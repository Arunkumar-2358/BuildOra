import crypto from "crypto";

/**
 * Mock payment provider — lets the full checkout → verify → activate flow run
 * locally with zero gateway keys. `createOrder` returns a synthetic order and a
 * pre-signed handshake that the frontend echoes straight back to /verify, so the
 * verification code path is identical to the real gateway's (only the source of
 * the signed payload differs). Swap PAYMENT_PROVIDER=razorpay in Phase 4.
 */
const MOCK_SECRET = "mock_secret";

const sign = (orderId, paymentId) =>
  crypto.createHmac("sha256", MOCK_SECRET).update(`${orderId}|${paymentId}`).digest("hex");

export const mockProvider = {
  name: "mock",
  publicKey: "mock_key", // the frontend renders a fake "Pay" button for this key

  async createOrder({ amountPaise, currency, receipt, notes }) {
    const orderId = `order_mock_${crypto.randomBytes(8).toString("hex")}`;
    const paymentId = `pay_mock_${crypto.randomBytes(8).toString("hex")}`;
    return {
      order: { id: orderId, amount: amountPaise, currency, receipt, notes },
      // Mock-only: a ready-to-submit successful payment the client can confirm.
      handshake: { orderId, paymentId, signature: sign(orderId, paymentId) }
    };
  },

  // Same HMAC check the Razorpay adapter will use.
  verifyPayment({ orderId, paymentId, signature }) {
    if (!orderId || !paymentId || !signature) return false;
    const expected = sign(orderId, paymentId);
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch {
      return false;
    }
  }
};
