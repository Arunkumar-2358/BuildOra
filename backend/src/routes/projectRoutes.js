import express from "express";
import { body } from "express-validator";
import { getRecommendedContractors } from "../controllers/discoveryController.js";
import {
  createProject,
  getProjectById,
  getProjects,
  saveProject,
  updateProjectStatus
} from "../controllers/projectController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

router
  .route("/")
  .get(protect, getProjects)
  .post(
    protect,
    authorize("customer"),
    upload.array("images", 6),
    [
      body("title").trim().notEmpty().withMessage("Title is required"),
      body("description").trim().isLength({ min: 20 }).withMessage("Description must be at least 20 characters"),
      body("budget").isNumeric().withMessage("Budget must be numeric"),
      body("location").trim().notEmpty().withMessage("Location is required"),
      body("category").isIn(["construction", "interior", "renovation", "architecture", "landscaping", "other"]),
      body("timeline").trim().notEmpty().withMessage("Timeline is required")
    ],
    validate,
    createProject
  );

router.get("/:id", protect, getProjectById);
router.get("/:id/recommended", protect, getRecommendedContractors);
router.patch("/:id/status", protect, authorize("customer"), body("status").isIn(["open", "in-review", "awarded", "completed", "cancelled"]), validate, updateProjectStatus);
router.patch("/:id/save", protect, authorize("contractor"), saveProject);

export default router;
