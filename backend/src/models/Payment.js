import mongoose from "mongoose";

/**
 * Payment records power the admin payment-tracking dashboard.
 * A payment is created when a bid is accepted (status "pending") and marked
 * "completed" when the project is completed. Commission is the platform's cut.
 */
const paymentSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    bid: { type: mongoose.Schema.Types.ObjectId, ref: "Bid" },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    contractor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    amount: { type: Number, required: true }, // total project value
    commissionRate: { type: Number, default: 0.1 }, // platform cut (10%)
    commission: { type: Number, required: true }, // amount * commissionRate
    contractorEarning: { type: Number, required: true }, // amount - commission

    status: {
      type: String,
      enum: ["pending", "completed", "refunded"],
      default: "pending"
    }
  },
  { timestamps: true }
);

// One payment per project (the awarded engagement).
paymentSchema.index({ project: 1 }, { unique: true });
paymentSchema.index({ status: 1, createdAt: -1 });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
