import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import healthRoutes from "./routes/health";
import errorHandler from "./middleware/errorHandler";
import { logger } from "./middleware/logger";

// Load environment variables before anything else
dotenv.config();

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────

// Built-in CORS from the `cors` package – allows the configured frontend origin.
// In production the FRONTEND_URL env var is set to the Vercel deployment URL.
app.use(
  cors({
    origin: (process.env.FRONTEND_URL || "http://localhost:3000")
      .split(",")
      .map((o) => o.trim()),
    credentials: false,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api", healthRoutes);

// ── Error Handler (must be last) ──────────────────────────────────────────────
app.use(errorHandler);

export default app;
