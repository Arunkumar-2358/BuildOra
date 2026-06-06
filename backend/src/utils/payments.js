import Payment from "../models/Payment.js";
import { getSettings } from "../services/settingsService.js";

// Fallback only — the live commission rate is admin-configurable via PlatformSettings.
export const DEFAULT_COMMISSION_RATE = 0.03;

// Create (or update) the commission record for an awarded bid. Idempotent via the
// unique index on `project`, so re-accepting won't create duplicates. Status is
// left untouched on update so a completed payment stays completed. The rate is
// read from PlatformSettings and stored per-record for auditability.
export const upsertPaymentForBid = async ({ project, bid }) => {
  const settings = await getSettings();
  const rate =
    typeof settings?.commissionRate === "number" ? settings.commissionRate : DEFAULT_COMMISSION_RATE;
  const amount = bid.quotationAmount || 0;
  const commission = Math.round(amount * rate);
  return Payment.findOneAndUpdate(
    { project: project._id },
    {
      $set: {
        bid: bid._id,
        customer: project.customer,
        contractor: bid.contractor,
        amount,
        commissionRate: rate,
        commission,
        contractorEarning: amount - commission
      },
      $setOnInsert: { project: project._id, status: "pending" }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

// Move a project's payment to a terminal state when the project finishes.
export const setPaymentStatusForProject = async (projectId, projectStatus) => {
  const statusMap = { completed: "completed", cancelled: "refunded" };
  const status = statusMap[projectStatus];
  if (!status) return;
  await Payment.findOneAndUpdate({ project: projectId }, { $set: { status } });
};
