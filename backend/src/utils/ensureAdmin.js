import User from "../models/User.js";

/**
 * Idempotently ensures an admin account exists, driven by env vars:
 *   ADMIN_EMAIL, ADMIN_PASSWORD, (optional) ADMIN_NAME
 * Runs on startup so deployments can bootstrap an admin without a manual step,
 * and so local in-memory dev gets a fresh admin on every restart.
 * No-op when the env vars are absent (never auto-creates a default admin).
 */
export const ensureAdmin = async () => {
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return null;

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== "admin" || existing.status !== "active") {
      existing.role = "admin";
      existing.status = "active";
      await existing.save();
    }
    return existing;
  }

  const admin = await User.create({
    name: process.env.ADMIN_NAME || "Buildora Admin",
    email,
    password,
    role: "admin"
  });
  console.log(`Admin account ensured: ${email}`);
  return admin;
};
