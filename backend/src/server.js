import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import { corsOptions } from "./config/cors.js";
import { connectDB } from "./config/db.js";
import { attachSocketHandlers } from "./sockets/chatSocket.js";
import { ensureAdmin } from "./utils/ensureAdmin.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

await connectDB();
await ensureAdmin();

const server = http.createServer(app);
const io = new Server(server, { cors: corsOptions });

attachSocketHandlers(io);

server.listen(PORT, () => {
  console.log(`Buildora API running on port ${PORT}`);
});
