import dotenv from "dotenv";
import path from "path";

import express from "express";

declare module "express-serve-static-core" {
  interface Request {
    requestId?: string;
  }
}

// Load .env BEFORE any other imports that might instantiate services
const envPath = path.resolve(__dirname, "../.env");
console.log("[App] Loading .env from:", envPath);
console.log("[App] File exists:", require("fs").existsSync(envPath));
dotenv.config({ path: envPath });

import cors from "cors";
import healthRoutes from "./routes/health";
import reviewRoutes from "./routes/reviews";
import analysisRoutes from "./routes/analysis";
import discoveryRoutes from "./routes/discovery";
import errorHandler from "./middleware/errorHandler";
import { logger } from "./middleware/logger";
import { rateLimiter } from "./middleware/rateLimiter";
import { securityHeaders } from "./middleware/security";

const app = express();

// Security headers (CSP, HSTS, X-Frame-Options, etc.)
app.use(securityHeaders);

// Allow both scraper-frontend (3002) and main-frontend (3000) by default
const allowedOrigins = (
  process.env.FRONTEND_URL || "http://localhost:3000,http://localhost:3002"
)
  .split(",")
  .map((o) => o.trim());

// Enhanced CORS with proper origin whitelist
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("NOT_ALLOWED_ORIGIN"), false);
    },
    credentials: false,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept", "Authorization"],
  })
);

// 50mb limit to handle large review JSON uploads from scraper-frontend
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

// Request ID middleware for correlation
app.use((req, res, next) => {
  const requestId = req.headers["x-request-id"] as string || 
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  (req as any).requestId = requestId;
  res.setHeader("X-Request-ID", requestId);
  next();
});

// Logging with request ID
app.use(logger);

// Rate limiting middleware (general endpoints)
app.use(rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  skipHealthCheck: true,
}));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api", healthRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api", discoveryRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error_code: "ROUTE_NOT_FOUND",
    error_message: `Route ${req.method} ${req.path} not found`,
    request_id: (req as any).requestId,
  });
});

// ── Error Handler ───────────────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
