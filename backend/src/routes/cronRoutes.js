import express from "express";
import { runCronJob } from "../controllers/cronController.js";

const router = express.Router();

// Secret-guarded inside the controller (no JWT — called by an external scheduler).
router.post("/:job", runCronJob);

export default router;
