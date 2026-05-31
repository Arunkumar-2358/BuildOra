import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadMany } from "../utils/uploadToCloudinary.js";

export const MAX_VOICE_DURATION = 300; // seconds (5 minutes)

export const startChat = asyncHandler(async (req, res) => {
  const { participantId, projectId } = req.body;
  const participants = [req.user._id.toString(), participantId].sort();
  const query = { participants: { $all: participants, $size: 2 } };
  if (projectId) query.project = projectId;

  let chat = await Chat.findOne(query);

  if (!chat) {
    chat = await Chat.create({ participants, project: projectId });
  }

  res.status(201).json(
    await chat.populate([
      { path: "participants", select: "name role city profileImage" },
      { path: "project", select: "title" },
      { path: "lastMessage" }
    ])
  );
});

export const getChats = asyncHandler(async (req, res) => {
  const chats = await Chat.find({ participants: req.user._id })
    .populate("participants", "name role city profileImage")
    .populate("project", "title")
    .populate("lastMessage")
    .sort({ updatedAt: -1 });

  res.json(chats);
});

export const getMessages = asyncHandler(async (req, res) => {
  const chat = await Chat.findOne({ _id: req.params.chatId, participants: req.user._id });

  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  const messages = await Message.find({ chat: chat._id })
    .populate("sender", "name profileImage")
    .populate("receiver", "name profileImage")
    .sort({ createdAt: 1 });

  res.json(messages);
});

// Uploads a recorded voice clip and returns a token the client then sends
// through the realtime `message:send` socket event (mirrors the photo-token
// pattern). The message itself is created in the socket layer so it broadcasts
// in real time. Binary never touches the socket — only the resulting URL.
export const uploadVoice = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No audio file provided");
  }

  const chat = await Chat.findOne({ _id: req.body.chatId, participants: req.user._id });
  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  const duration = Math.round(Number(req.body.duration) || 0);
  if (duration <= 0) {
    res.status(400);
    throw new Error("Recording duration is required");
  }
  if (duration > MAX_VOICE_DURATION) {
    res.status(400);
    throw new Error(`Voice messages cannot exceed ${MAX_VOICE_DURATION} seconds`);
  }

  const [uploaded] = await uploadMany([req.file], "buildora/voice");

  res.status(201).json({
    url: uploaded.url,
    publicId: uploaded.publicId,
    duration,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size
  });
});

// Uploads a chat file attachment (document/image) and returns a token the
// client sends via the realtime `message:send` socket event. Same pattern as
// voice — binary goes over HTTPS, only the resulting URL travels the socket.
export const uploadAttachment = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No file provided");
  }

  const chat = await Chat.findOne({ _id: req.body.chatId, participants: req.user._id });
  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  const [uploaded] = await uploadMany([req.file], "buildora/attachments");

  res.status(201).json({
    url: uploaded.url,
    publicId: uploaded.publicId,
    name: req.file.originalname,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size
  });
});
