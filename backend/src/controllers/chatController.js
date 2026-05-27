import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import { asyncHandler } from "../utils/asyncHandler.js";

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
