import cron from "node-cron";
import { materializeMonthlyReport } from "../services/revenueService.js";
import { expireSubscriptions, sendRenewalReminders } from "../services/subscriptionService.js";

// Named jobs — each is a pure async function so it can run on a schedule (here)
// or be triggered via POST /api/cron/:job on serverless.
const JOBS = {
  "subscription-expiry": expireSubscriptions,
  "renewal-reminders": sendRenewalReminders,
  "revenue-rollup": () => materializeMonthlyReport()
};

export const JOB_NAMES = Object.keys(JOBS);

export const runJob = async (name) => {
  const fn = JOBS[name];
  if (!fn) {
    const err = new Error(`Unknown job: ${name}. Valid: ${JOB_NAMES.join(", ")}`);
    err.statusCode = 400;
    throw err;
  }
  return fn();
};

/**
 * Schedule the in-process jobs on the long-lived server. Skipped when
 * DISABLE_CRON=true (e.g. on serverless, where an external scheduler hits
 * POST /api/cron/:job instead).
 */
export const registerCron = () => {
  if (process.env.DISABLE_CRON === "true") {
    console.log("Cron disabled (DISABLE_CRON=true)");
    return;
  }
  const safe = (name) => () => runJob(name).catch((e) => console.error(`cron ${name}:`, e.message));
  cron.schedule("0 2 * * *", safe("subscription-expiry")); // daily 02:00 — expire lapsed subs
  cron.schedule("0 9 * * *", safe("renewal-reminders")); // daily 09:00 — 7/3/1-day reminders
  cron.schedule("30 1 * * *", safe("revenue-rollup")); // daily 01:30 — refresh month rollup
  console.log("Cron scheduled: subscription-expiry, renewal-reminders, revenue-rollup");
};
