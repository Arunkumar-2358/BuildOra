import express from "express";
import { getAdminRevenue, getMyEarnings } from "../controllers/revenueController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", protect, authorize("contractor"), getMyEarnings);
router.get("/admin", protect, authorize("admin"), getAdminRevenue);

export default router;
