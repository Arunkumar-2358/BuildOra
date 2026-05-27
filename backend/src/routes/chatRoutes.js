import express from "express";
import { body } from "express-validator";
import { getChats, getMessages, startChat } from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

router.get("/", protect, getChats);
router.post(
  "/start",
  protect,
  [
    body("participantId").isMongoId().withMessage("Participant is required"),
    body("projectId").optional().isMongoId().withMessage("Project must be valid")
  ],
  validate,
  startChat
);
router.get("/:chatId/messages", protect, getMessages);

export default router;
