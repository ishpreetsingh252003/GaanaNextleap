import { Request, Response, NextFunction } from "express";

// Headers to sanitize from logs
const SENSITIVE_HEADERS = ["authorization", "cookie", "x-api-key", "x-auth-token"];

export const logger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const ts = new Date().toISOString();
  const requestId = req.requestId || "unknown";

  // Sanitize headers for logging
  const safeHeaders = { ...req.headers };
  for (const h of SENSITIVE_HEADERS) {
    if (safeHeaders[h]) {
      safeHeaders[h] = "[REDACTED]";
    }
  }

  // Log request start
  console.log(`[${ts}] [${requestId}] → ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get("User-Agent")?.substring(0, 50),
  });

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `[${ts}] [${requestId}] ← ${req.method} ${req.path} → ${res.statusCode} (${duration}ms)`
    );
  });

  next();
};