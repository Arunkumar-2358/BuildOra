import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { corsOptions } from "./config/cors.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import bidRoutes from "./routes/bidRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import cronRoutes from "./routes/cronRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import revenueRoutes from "./routes/revenueRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors(corsOptions));
// Ensure preflight (OPTIONS) requests are handled with the same policy.
app.options("*", cors(corsOptions));

// Webhooks need the raw request body for HMAC signature verification, so they
// must be mounted BEFORE the JSON body parser.
app.use("/api/webhooks", webhookRoutes);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 200 }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "buildora-api" });
});

app.get("/api", (req, res) => {
  res.json({
    service: "buildora-api",
    status: "running",
    frontend: process.env.CLIENT_URL || "http://localhost:5173",
    routes: ["/api/auth", "/api/projects", "/api/bids", "/api/chats", "/api/users", "/api/reviews", "/api/admin", "/api/subscriptions", "/api/revenue", "/api/cron", "/api/webhooks"]
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/users", userRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/revenue", revenueRoutes);
app.use("/api/cron", cronRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
