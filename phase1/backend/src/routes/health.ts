import { Router, Request, Response } from "express";

const router = Router();

/**
 * GET /api/health
 * Returns a simple health check response.
 * Used by Railway to verify the server is running.
 */
router.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    message: "Gaana Discovery AI backend is running",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

export default router;
