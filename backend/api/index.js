/**
 * Vercel serverless entry point.
 *
 * Runs the Express REST API as a serverless function. Note: Socket.io (real-time
 * chat/voice/presence) does NOT run here — Vercel has no persistent server. The
 * REST `POST /chats/:chatId/messages` endpoint keeps chat working; real-time
 * delivery only happens on a long-running host (Render/Railway/Fly).
 *
 * Requires MONGO_URI (MongoDB Atlas) — the in-memory dev DB cannot run serverless.
 */
import mongoose from "mongoose";
import app from "../src/app.js";
import { ensureAdmin } from "../src/utils/ensureAdmin.js";

let dbPromise = null;
let adminEnsured = false;

// Reuse the connection across warm invocations; connect once on cold start.
const ensureDb = async () => {
  if (mongoose.connection.readyState === 1) return;
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required. Set it to your MongoDB Atlas connection string in Vercel env.");
  }
  if (!dbPromise) dbPromise = mongoose.connect(process.env.MONGO_URI);
  await dbPromise;
  if (!adminEnsured) {
    adminEnsured = true;
    await ensureAdmin().catch((error) => console.error("ensureAdmin failed:", error.message));
  }
};

export default async function handler(req, res) {
  try {
    await ensureDb();
  } catch (error) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ message: error.message }));
    return;
  }
  return app(req, res);
}
