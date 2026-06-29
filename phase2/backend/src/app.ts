import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import healthRoutes from "./routes/health";
import reviewRoutes from "./routes/reviews";
import errorHandler from "./middleware/errorHandler";
import { logger } from "./middleware/logger";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: (process.env.FRONTEND_URL || "http://localhost:3000")
      .split(",")
      .map((o) => o.trim()),
    credentials: false,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api", healthRoutes);
app.use("/api/reviews", reviewRoutes);

// ── Error Handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
