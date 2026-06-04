/**
 * One-off seed/backfill script. Run against a persistent database:
 *   MONGO_URI=<atlas-uri> ADMIN_EMAIL=admin@buildora.com ADMIN_PASSWORD=Admin@12345 npm run seed
 *
 * - Ensures an admin account (defaults if env not supplied).
 * - Backfills Payment records for every already-accepted bid, settling them to
 *   completed/refunded based on the project's current status.
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Bid from "../models/Bid.js";
import Project from "../models/Project.js";
import { getSettings } from "../services/settingsService.js";
import { ensureAdmin } from "../utils/ensureAdmin.js";
import { setPaymentStatusForProject, upsertPaymentForBid } from "../utils/payments.js";
import { isPremiumProject } from "../utils/premium.js";
import { seedPlans } from "./plans.js";

dotenv.config();

const run = async () => {
  await connectDB();

  // Default admin credentials if not provided via env.
  process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@buildora.com";
  process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@12345";
  const admin = await ensureAdmin();
  console.log(`✓ Admin: ${admin?.email}`);

  // Subscription plan catalog + platform settings (3% commission, free-bid quota).
  const planCount = await seedPlans();
  console.log(`✓ Seeded ${planCount} subscription plan(s) + platform settings`);

  // Backfill premium visibility on existing projects from current premium rules.
  const settings = await getSettings();
  const projects = await Project.find().select("budget category visibility");
  let visUpdated = 0;
  for (const project of projects) {
    const visibility = isPremiumProject(settings, { budget: project.budget, category: project.category })
      ? "premium"
      : "public";
    if (project.visibility !== visibility) {
      project.visibility = visibility;
      await project.save();
      visUpdated += 1;
    }
  }
  console.log(`✓ Backfilled visibility on ${visUpdated} project(s)`);

  const acceptedBids = await Bid.find({ status: "accepted" }).populate("project");
  let count = 0;
  for (const bid of acceptedBids) {
    if (!bid.project) continue;
    await upsertPaymentForBid({ project: bid.project, bid });
    await setPaymentStatusForProject(bid.project._id, bid.project.status);
    count += 1;
  }
  console.log(`✓ Backfilled ${count} payment(s) from accepted bids`);

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
