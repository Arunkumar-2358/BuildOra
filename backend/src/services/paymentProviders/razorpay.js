import crypto from "crypto";

/**
 * Razorpay provider. createOrder uses the SDK (lazy-imported so the dependency
 * only loads when this provider is actually selected); verifyPayment recomputes
 * the Checkout signature HMAC_SHA256(order_id|payment_id, key_secret). The amount
 * is always the server-side plan price — never trusted from the client.
 */
let client = null;
const getClient = async () => {
  if (client) return client;
  const { default: Razorpay } = await import("razorpay");
  client = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
  return client;
};

export const razorpayConfigured = () => Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

export const razorpayProvider = {
  name: "razorpay",
  get publicKey() {
    return process.env.RAZORPAY_KEY_ID;
  },

  async createOrder({ amountPaise, currency, receipt, notes }) {
    const rzp = await getClient();
    const order = await rzp.orders.create({ amount: amountPaise, currency, receipt, notes });
    // No handshake — the browser opens Razorpay Checkout and posts back a signed response.
    return { order: { id: order.id, amount: order.amount, currency: order.currency, receipt }, handshake: null };
  },

  verifyPayment({ orderId, paymentId, signature }) {
    if (!orderId || !paymentId || !signature) return false;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(`${orderId}|${paymentId}`)
      .digest("hex");
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch {
      return false;
    }
  }
};
