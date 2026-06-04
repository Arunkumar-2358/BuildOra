/**
 * Stripe adapter stub — an interface placeholder so the registry is multi-gateway
 * ready. Implement createOrder (PaymentIntent) and verifyPayment (Stripe webhook
 * signature) when Stripe is enabled; until then selecting it falls back to mock
 * unless keys are present.
 */
export const stripeConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY);

export const stripeProvider = {
  name: "stripe",
  get publicKey() {
    return process.env.STRIPE_PUBLISHABLE_KEY;
  },
  async createOrder() {
    throw new Error("Stripe provider not implemented yet");
  },
  verifyPayment() {
    return false;
  }
};
