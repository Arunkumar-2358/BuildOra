import express from "express";
import { razorpayWebhook } from "../controllers/webhookController.js";

const router = express.Router();

// Raw body is required for HMAC signature verification — must be mounted before
// the global express.json() parser in app.js.
router.post("/razorpay", express.raw({ type: "*/*" }), razorpayWebhook);

export default router;
