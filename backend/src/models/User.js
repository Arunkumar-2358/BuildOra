import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const contractorProfileSchema = new mongoose.Schema(
  {
    businessName: String,
    experience: Number,
    services: [String],
    pricingRange: String,
    portfolioImages: [
      {
        url: String,
        publicId: String
      }
    ],
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
    bio: String,

    // Professional details (surfaced on the public portfolio page).
    specialization: String,
    skills: [String],
    certifications: [String],
    licenseNumber: String,
    isVerified: { type: Boolean, default: false },
    availability: {
      type: String,
      enum: ["available", "busy", "unavailable"],
      default: "available"
    }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ["customer", "contractor"], required: true },
    phone: { type: String, trim: true },
    city: { type: String, trim: true },
    profileImage: {
      url: String,
      publicId: String
    },
    contractorProfile: contractorProfileSchema,
    savedProjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }]
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = function matchPassword(password) {
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
