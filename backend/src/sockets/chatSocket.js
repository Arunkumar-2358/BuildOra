import jwt from "jsonwebtoken";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { createNotification } from "../services/notificationService.js";

const onlineUsers = new Map();

export const attachSocketHandlers = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user) return next(new Error("User not found"));

      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    onlineUsers.set(userId, socket.id);
    // Join a personal room so notifications can be pushed to this user
    socket.join(userId);
    io.emit("presence:update", Array.from(onlineUsers.keys()));

    socket.on("chat:join", (chatId) => {
      socket.join(chatId);
    });

    socket.on("message:send", async ({ chatId, receiverId, content, type = "text", audio, file }, callback) => {
      try {
        const chat = await Chat.findOne({ _id: chatId, participants: socket.user._id });
        if (!chat) throw new Error("Chat not found");

        const messageData = {
          chat: chat._id,
          sender: socket.user._id,
          receiver: receiverId,
          type
        };

        if (type === "voice") {
          if (!audio?.url) throw new Error("Voice message is missing its audio clip");
          messageData.audio = {
            url: audio.url,
            publicId: audio.publicId,
            duration: audio.duration,
            mimeType: audio.mimeType,
            sizeBytes: audio.sizeBytes
          };
        } else if (type === "file") {
          if (!file?.url) throw new Error("File message is missing its attachment");
          messageData.file = {
            url: file.url,
            publicId: file.publicId,
            name: file.name,
            mimeType: file.mimeType,
            sizeBytes: file.sizeBytes
          };
        } else {
          if (!content?.trim()) throw new Error("Message content is required");
          messageData.content = content;
        }

        const message = await Message.create(messageData);

        chat.lastMessage = message._id;
        await chat.save();

        const kindLabel = type === "voice" ? "voice message" : type === "file" ? "file" : "message";

        // Persist notification + emit real-time push via notificationService
        await createNotification({
          userId: receiverId,
          type: "message",
          title: "New message",
          body: `${socket.user.name} sent you a ${kindLabel}.`,
          link: `/chat/${chat._id}`
        });

        const populated = await message.populate([
          { path: "sender", select: "name profileImage" },
          { path: "receiver", select: "name profileImage" }
        ]);

        io.to(chatId).emit("message:new", populated);
        callback?.({ ok: true, message: populated });
      } catch (error) {
        callback?.({ ok: false, message: error.message });
      }
    });

    socket.on("typing:start", ({ chatId }) => {
      socket.to(chatId).emit("typing:start", { userId });
    });

    socket.on("typing:stop", ({ chatId }) => {
      socket.to(chatId).emit("typing:stop", { userId });
    });

    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
      io.emit("presence:update", Array.from(onlineUsers.keys()));
    });
  });
};
