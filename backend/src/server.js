import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { attachSocketHandlers } from "./sockets/chatSocket.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

await connectDB();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
  }
});

attachSocketHandlers(io);

server.listen(PORT, () => {
  console.log(`Buildora API running on port ${PORT}`);
});
