import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import { corsOptions } from "./config/cors.js";
import { connectDB } from "./config/db.js";
import { registerCron } from "./cron/index.js";
import { attachSocketHandlers } from "./sockets/chatSocket.js";
import { ensureAdmin } from "./utils/ensureAdmin.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

await connectDB();
await ensureAdmin();
registerCron();

const server = http.createServer(app);
const io = new Server(server, { cors: corsOptions });

// Expose io to controllers so REST endpoints can broadcast in real time.
app.set("io", io);
attachSocketHandlers(io);

server.listen(PORT, () => {
  console.log(`Buildora API running on port ${PORT}`);
});
