import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    budget: { type: Number, required: true },
    location: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["construction", "interior", "renovation", "architecture", "landscaping", "other"],
      required: true
    },
    timeline: { type: String, required: true },
    images: [
      {
        url: String,
        publicId: String,
        mimeType: String,
        originalName: String,
        bytes: Number
      }
    ],
    status: {
      type: String,
      enum: ["open", "in-review", "awarded", "completed", "cancelled"],
      default: "open"
    }
  },
  { timestamps: true }
);

projectSchema.index({ title: "text", description: "text", location: "text", category: "text" });

const Project = mongoose.model("Project", projectSchema);

export default Project;
