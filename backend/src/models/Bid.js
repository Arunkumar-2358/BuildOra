import mongoose from "mongoose";

const bidSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    contractor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    quotationAmount: { type: Number, required: true },
    estimatedDuration: { type: String, required: true },
    proposalMessage: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending"
    }
  },
  { timestamps: true }
);

bidSchema.index({ project: 1, contractor: 1 }, { unique: true });

const Bid = mongoose.model("Bid", bidSchema);

export default Bid;
