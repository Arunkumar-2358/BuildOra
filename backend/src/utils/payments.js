import Payment from "../models/Payment.js";

// Platform commission taken from each awarded project.
export const COMMISSION_RATE = 0.1;

// Create (or update) the payment record for an awarded bid. Idempotent via the
// unique index on `project`, so re-accepting won't create duplicates. Status is
// left untouched on update so a completed payment stays completed.
export const upsertPaymentForBid = async ({ project, bid }) => {
  const amount = bid.quotationAmount || 0;
  const commission = Math.round(amount * COMMISSION_RATE);
  return Payment.findOneAndUpdate(
    { project: project._id },
    {
      $set: {
        bid: bid._id,
        customer: project.customer,
        contractor: bid.contractor,
        amount,
        commissionRate: COMMISSION_RATE,
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
