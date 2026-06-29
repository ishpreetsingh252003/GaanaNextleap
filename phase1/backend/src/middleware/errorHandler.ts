import { Request, Response, NextFunction } from "express";

/**
 * Global error handler middleware.
 * Returns a consistent JSON error shape to the client.
 * Stack traces are only included in development mode.
 */
export default function errorHandler(
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  console.error(`[ErrorHandler] ${err.message}`, err.stack);

  const status: number = typeof err.status === "number" ? err.status : 500;
  const message: string =
    err.message || "An unexpected error occurred. Please try again later.";

  res.status(status).json({
    error_code: err.code || "INTERNAL_ERROR",
    error_message: message,
    error_details:
      process.env.NODE_ENV === "development"
        ? err.stack
        : null,
  });
}
