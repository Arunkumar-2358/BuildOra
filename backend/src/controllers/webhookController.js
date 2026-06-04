import crypto from "crypto";
import Transaction from "../models/Transaction.js";
import { captureAndActivate } from "../services/subscriptionService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * POST /api/webhooks/razorpay — the payment source of truth. Razorpay calls this
 * server-to-server, so it stays correct even if the browser closes after paying.
 * The raw request body is HMAC-verified against RAZORPAY_WEBHOOK_SECRET, then the
 * matching transaction is captured + its subscription activated idempotently.
 */
export const razorpayWebhook = asyncHandler(async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    res.status(503);
    throw new Error("Webhook not configured");
  }

  // req.body is a Buffer here (mounted with express.raw before the JSON parser).
  const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
  const signature = req.headers["x-razorpay-signature"] || "";
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");

  let valid = false;
  try {
    valid = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    valid = false;
  }
  if (!valid) {
    res.status(400);
    throw new Error("Invalid webhook signature");
  }

  const event = JSON.parse(raw.toString("utf8"));
  // On a payment.* event the order id is entity.order_id and entity.id is the
  // payment id; on order.paid the entity IS the order (entity.id is the order id),
  // so only take the payment id from a payment entity — never store an order id.
  const paymentEntity = event?.payload?.payment?.entity;
  const orderEntity = event?.payload?.order?.entity;
  const orderId = paymentEntity?.order_id || orderEntity?.id;
  const paymentId = paymentEntity?.id;

  if (orderId && ["payment.captured", "order.paid"].includes(event.event)) {
    const transaction = await Transaction.findOne({ gatewayOrderId: orderId });
    if (transaction && transaction.status !== "captured") {
      await captureAndActivate(transaction, { paymentId });
    }
  } else if (orderId && event.event === "payment.failed") {
    await Transaction.findOneAndUpdate(
      { gatewayOrderId: orderId, status: { $ne: "captured" } },
      { $set: { status: "failed" } }
    );
  }

  res.json({ received: true });
});
