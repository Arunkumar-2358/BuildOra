import express from "express";
import { body } from "express-validator";
import {
  createReview,
  getContractorReviews,
  getMyReviews,
  getProjectReview,
  getRatingSummary,
  replyToReview,
  toggleHelpful,
  updateReply,
  updateReview
} from "../controllers/reviewController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("customer"),
  upload.array("photos", 5),
  [
    body("project").isMongoId().withMessage("A valid project is required"),
    body("overallRating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5 stars"),
    body("reviewText").optional({ checkFalsy: true }).isLength({ max: 1000 }).withMessage("Review text cannot exceed 1000 characters")
  ],
  validate,
  createReview
);

router.get("/me", protect, authorize("customer"), getMyReviews);
router.get("/project/:projectId", protect, getProjectReview);
router.get("/contractor/:contractorId", protect, getContractorReviews);
router.get("/contractor/:contractorId/summary", protect, getRatingSummary);

router.patch(
  "/:id",
  protect,
  authorize("customer"),
  [
    body("overallRating").optional().isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5 stars"),
    body("reviewText").optional({ checkFalsy: true }).isLength({ max: 1000 }).withMessage("Review text cannot exceed 1000 characters")
  ],
  validate,
  updateReview
);

router.post("/:id/helpful", protect, toggleHelpful);

router
  .route("/:id/reply")
  .post(
    protect,
    authorize("contractor"),
    body("replyText").trim().isLength({ min: 1, max: 500 }).withMessage("Reply must be 1-500 characters"),
    validate,
    replyToReview
  )
  .patch(
    protect,
    authorize("contractor"),
    body("replyText").trim().isLength({ min: 1, max: 500 }).withMessage("Reply must be 1-500 characters"),
    validate,
    updateReply
  );

export default router;
