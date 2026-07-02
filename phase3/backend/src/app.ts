import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import healthRoutes from "./routes/health";
import reviewRoutes from "./routes/reviews";
import analysisRoutes from "./routes/analysis";
import discoveryRoutes from "./routes/discovery";
import errorHandler from "./middleware/errorHandler";
import { logger } from "./middleware/logger";

dotenv.config();

const app = express();

// Allow both scraper-frontend (3002) and main-frontend (3000) by default
const allowedOrigins = (
  process.env.FRONTEND_URL || "http://localhost:3000,http://localhost:3002"
)
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: false,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept", "Authorization"],
  })
);

// 50mb limit to handle large review JSON uploads from scraper-frontend
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api", healthRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api", discoveryRoutes);

// ── Error Handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
