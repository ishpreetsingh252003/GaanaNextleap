import { Request, Response, NextFunction } from "express";

// Consistent error response format
interface ErrorResponse {
  error_code: string;
  error_message: string;
  error_details?: string | null;
  request_id?: string;
}

// Known error codes (uppercase snake case)
const KNOWN_ERROR_CODES = [
  "VALIDATION_ERROR",
  "NOT_FOUND",
  "INTERNAL_ERROR",
  "RATE_LIMIT_EXCEEDED",
  "GROQ_API_ERROR",
  "SCRAPE_ERROR",
  "NO_REVIEWS",
  "INVALID_SOURCES",
  "SERVICE_UNAVAILABLE",
];

export default function errorHandler(
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  const status: number = typeof err.status === "number" ? err.status : 500;
  
  // Normalize error code to uppercase snake case
  let errorCode = err.code || "INTERNAL_ERROR";
  if (typeof errorCode === "string") {
    errorCode = errorCode
      .toUpperCase()
      .replace(/-/g, "_")
      .replace(/\s+/g, "_");
  }

  // Log error with request ID
  console.error(
    `[ErrorHandler] [${req.requestId || "unknown"}] ${errorCode}: ${err.message}`,
    process.env.NODE_ENV === "development" ? err.stack : ""
  );

  // Build response
  const response: ErrorResponse = {
    error_code: errorCode,
    error_message: err.message || "An unexpected error occurred.",
    request_id: req.requestId,
  };

  // Only include stack traces in development
  if (process.env.NODE_ENV === "development") {
    response.error_details = err.stack || null;
  }

  res.status(status).json(response);
}