import { Request, Response, NextFunction } from "express";

/**
 * Request logger middleware.
 * Logs timestamp, HTTP method, path, status code, and response duration.
 * Intentionally omits request body and headers to prevent PII leakage in logs.
 */
export const logger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `[${timestamp}] ${req.method} ${req.path} → ${res.statusCode} (${duration}ms)`
    );
  });

  next();
};
