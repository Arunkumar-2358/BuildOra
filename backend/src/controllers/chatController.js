import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";
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

// POST /api/chats/:chatId/messages — send a message over REST.
// Works on any host (including serverless where Socket.io is unavailable).
// If a Socket.io instance is attached (long-running host), it also broadcasts
// in real time; otherwise clients pick it up via polling.
export const sendMessage = asyncHandler(async (req, res) => {
  const { content, type = "text", audio, file } = req.body;

  const chat = await Chat.findOne({ _id: req.params.chatId, participants: req.user._id }).populate("participants", "_id");
  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  const receiverId = chat.participants.find((p) => p._id.toString() !== req.user._id.toString())?._id;

  const messageData = { chat: chat._id, sender: req.user._id, receiver: receiverId, type };
  if (type === "voice") {
    if (!audio?.url) {
      res.status(400);
      throw new Error("Voice message requires an audio clip");
    }
    messageData.audio = audio;
  } else if (type === "file") {
    if (!file?.url) {
      res.status(400);
      throw new Error("File message requires an attachment");
    }
    messageData.file = file;
  } else {
    if (!content?.trim()) {
      res.status(400);
      throw new Error("Message content is required");
    }
    messageData.content = content;
  }

  const message = await Message.create(messageData);
  chat.lastMessage = message._id;
  await chat.save();

  const kindLabel = type === "voice" ? "voice message" : type === "file" ? "file" : "message";
  await Notification.create({
    user: receiverId,
    type: "message",
    title: "New message",
    body: `${req.user.name} sent you a ${kindLabel}.`,
    link: `/chat/${chat._id}`
  });

  const populated = await message.populate([
    { path: "sender", select: "name profileImage" },
    { path: "receiver", select: "name profileImage" }
  ]);

  const io = req.app.get("io");
  if (io) {
    io.to(req.params.chatId).emit("message:new", populated);
    io.to(receiverId.toString()).emit("notification:new", { type: "message", title: "New message", link: `/chat/${chat._id}` });
  }

  res.status(201).json(populated);
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
