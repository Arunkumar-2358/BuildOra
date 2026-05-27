import jwt from "jsonwebtoken";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

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
    socket.join(userId);
    io.emit("presence:update", Array.from(onlineUsers.keys()));

    socket.on("chat:join", (chatId) => {
      socket.join(chatId);
    });

    socket.on("message:send", async ({ chatId, receiverId, content }, callback) => {
      try {
        const chat = await Chat.findOne({ _id: chatId, participants: socket.user._id });
        if (!chat) throw new Error("Chat not found");

        const message = await Message.create({
          chat: chat._id,
          sender: socket.user._id,
          receiver: receiverId,
          content
        });

        chat.lastMessage = message._id;
        await chat.save();

        await Notification.create({
          user: receiverId,
          type: "message",
          title: "New message",
          body: `${socket.user.name} sent you a message.`,
          link: `/chat/${chat._id}`
        });

        const populated = await message.populate([
          { path: "sender", select: "name profileImage" },
          { path: "receiver", select: "name profileImage" }
        ]);

        io.to(chatId).emit("message:new", populated);
        io.to(receiverId).emit("notification:new", {
          type: "message",
          title: "New message",
          link: `/chat/${chat._id}`
        });
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
