import mongoose from "mongoose";

// Reusable GeoJSON Point for 2dsphere geo-queries. coordinates = [lng, lat].
export const geoPointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: undefined } // [longitude, latitude]
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    budget: { type: Number, required: true },
    location: { type: String, required: true, trim: true },
    // Structured location for discovery & matching.
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    geo: { type: geoPointSchema, default: undefined },
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
projectSchema.index({ geo: "2dsphere" });

const Project = mongoose.model("Project", projectSchema);

export default Project;
