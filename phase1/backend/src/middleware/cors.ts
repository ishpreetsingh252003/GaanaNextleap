import { Request, Response, NextFunction } from "express";

/**
 * Custom CORS middleware
 * Allows only the configured frontend origin(s) to access the API.
 * Supports comma-separated origins in FRONTEND_URL for multi-env setups.
 */
export const corsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
    .split(",")
    .map((o) => o.trim());

  const requestOrigin = req.headers.origin || "";

  if (allowedOrigins.includes(requestOrigin)) {
    res.header("Access-Control-Allow-Origin", requestOrigin);
  }

  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Credentials", "false");

  // Respond immediately to preflight OPTIONS requests
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }

  next();
};
