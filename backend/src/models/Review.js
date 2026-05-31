import mongoose from "mongoose";

export const REVIEW_TAGS = [
  "on_time",
  "clean_workspace",
  "great_communication",
  "would_hire_again",
  "fair_pricing",
  "high_quality"
];

const subRatingSchema = new mongoose.Schema(
  {
    quality: { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 },
    timeliness: { type: Number, min: 1, max: 5 },
    value: { type: Number, min: 1, max: 5 }
  },
  { _id: false }
);

const replySchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 500 },
    editableUntil: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    contractor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    overallRating: { type: Number, required: true, min: 1, max: 5 },
    subRatings: subRatingSchema,
    tags: [{ type: String, enum: REVIEW_TAGS }],
    wouldHireAgain: { type: Boolean, default: null },

    reviewText: { type: String, trim: true, maxlength: 1000 },
    photos: [
      {
        url: String,
        publicId: String
      }
    ],

    isVerifiedProject: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ["visible", "hidden", "deleted"],
      default: "visible"
    },

    helpfulVoters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    helpfulCount: { type: Number, default: 0 },

    reply: replySchema,

    editableUntil: Date
  },
  { timestamps: true }
);

// One review per project per reviewer — database-level enforcement.
reviewSchema.index({ project: 1, customer: 1 }, { unique: true });
// Contractor profile display + admin queue ordering.
reviewSchema.index({ contractor: 1, status: 1, createdAt: -1 });
// "My reviews" page.
reviewSchema.index({ customer: 1, createdAt: -1 });

const Review = mongoose.model("Review", reviewSchema);

export default Review;
