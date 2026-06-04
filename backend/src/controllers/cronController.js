import { runJob } from "../cron/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * POST /api/cron/:job — serverless-safe job trigger, guarded by a shared secret
 * (e.g. Vercel Cron sending header `x-cron-secret`). Lets the same jobs that run
 * in-process on a long-lived server also run on platforms without background cron.
 */
export const runCronJob = asyncHandler(async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers["x-cron-secret"] !== secret) {
    res.status(401);
    throw new Error("Invalid or missing cron secret");
  }
  const result = await runJob(req.params.job);
  res.json({ job: req.params.job, result });
});
