import Bid from "../models/Bid.js";
import Notification from "../models/Notification.js";
import Project from "../models/Project.js";
import { assertCanBid, consumeFreeBid } from "../services/subscriptionService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { upsertPaymentForBid } from "../utils/payments.js";
import { notifyProjectOwner } from "./projectController.js";

export const createBid = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.body.project);

  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  if (project.customer.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error("Customers cannot bid on their own projects");
  }

  const existingBid = await Bid.findOne({ project: project._id, contractor: req.user._id });

  // Revenue gate: verify subscription / free-trial quota before accepting a bid.
  // Throws 402 (with a machine-readable code) when the contractor must subscribe.
  const { consumeFreeBid: shouldConsumeFreeBid } = await assertCanBid({
    user: req.user,
    project,
    isNewBid: !existingBid
  });

  if (existingBid) {
    existingBid.quotationAmount = req.body.quotationAmount;
    existingBid.estimatedDuration = req.body.estimatedDuration;
    existingBid.proposalMessage = req.body.proposalMessage;
    existingBid.status = "pending";

    const saved = await existingBid.save();
    await notifyProjectOwner({ project, bid: saved });
    res.status(200).json(await saved.populate("contractor", "name city profileImage contractorProfile"));
    return;
  }

  const bid = await Bid.create({
    project: project._id,
    contractor: req.user._id,
    quotationAmount: req.body.quotationAmount,
    estimatedDuration: req.body.estimatedDuration,
    proposalMessage: req.body.proposalMessage
  });

  // First bid on this project for a free-tier contractor — burn one trial credit
  // now that the bid has actually persisted.
  if (shouldConsumeFreeBid) await consumeFreeBid(req.user._id);

  await notifyProjectOwner({ project, bid });
  res.status(201).json(await bid.populate("contractor", "name city profileImage contractorProfile"));
});

export const getMyBids = asyncHandler(async (req, res) => {
  let filter = { contractor: req.user._id };

  if (req.user.role === "customer") {
    const projects = await Project.find({ customer: req.user._id }).select("_id");
    filter = { project: { $in: projects.map((project) => project._id) } };
  }

  const bids = await Bid.find(filter)
    .populate("project", "title budget location category status customer")
    .populate("contractor", "name city profileImage contractorProfile")
    .sort({ createdAt: -1 });

  res.json(bids);
});

export const updateBidStatus = asyncHandler(async (req, res) => {
  const bid = await Bid.findById(req.params.id).populate("project");

  if (!bid) {
    res.status(404);
    throw new Error("Bid not found");
  }

  if (bid.project.customer.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Only the project owner can update bid status");
  }

  bid.status = req.body.status;
  await bid.save();

  if (req.body.status === "accepted") {
    await Bid.updateMany(
      { project: bid.project._id, _id: { $ne: bid._id } },
      { $set: { status: "rejected" } }
    );
    bid.project.status = "awarded";
    await bid.project.save();
    // Record the awarded engagement as a pending payment for admin tracking.
    await upsertPaymentForBid({ project: bid.project, bid });
  }

  await Notification.create({
    user: bid.contractor,
    type: "bid-status",
    title: `Quotation ${bid.status}`,
    body: `Your quotation for ${bid.project.title} was ${bid.status}.`,
    link: `/projects/${bid.project._id}`
  });

  res.json(bid);
});
