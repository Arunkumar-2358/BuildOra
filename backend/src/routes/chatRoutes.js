import express from "express";
import { body } from "express-validator";
import { getChats, getMessages, sendMessage, startChat, uploadAttachment, uploadVoice } from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";
import { audioUpload, fileUpload } from "../middleware/uploadMiddleware.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

router.get("/", protect, getChats);
router.post("/voice", protect, audioUpload.single("audio"), uploadVoice);
router.post("/attachment", protect, fileUpload.single("file"), uploadAttachment);
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
router.post("/:chatId/messages", protect, sendMessage);

export default router;
