import express from "express";
import { body } from "express-validator";
import { createBid, getMyBids, updateBidStatus } from "../controllers/bidController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

router
  .route("/")
  .get(protect, getMyBids)
  .post(
    protect,
    authorize("contractor"),
    [
      body("project").isMongoId().withMessage("Project is required"),
      body("quotationAmount").isNumeric().withMessage("Quotation amount must be numeric"),
      body("estimatedDuration").trim().notEmpty().withMessage("Estimated duration is required"),
      body("proposalMessage").trim().isLength({ min: 20 }).withMessage("Proposal must be at least 20 characters")
    ],
    validate,
    createBid
  );

router.patch(
  "/:id/status",
  protect,
  authorize("customer"),
  body("status").isIn(["accepted", "rejected"]).withMessage("Status must be accepted or rejected"),
  validate,
  updateBidStatus
);

export default router;
