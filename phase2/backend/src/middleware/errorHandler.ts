import { Request, Response, NextFunction } from "express";

export default function errorHandler(
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  console.error(`[ErrorHandler] ${err.message}`, err.stack);
  const status: number = typeof err.status === "number" ? err.status : 500;
  res.status(status).json({
    error_code: err.code || "INTERNAL_ERROR",
    error_message: err.message || "An unexpected error occurred.",
    error_details: process.env.NODE_ENV === "development" ? err.stack : null,
  });
}
