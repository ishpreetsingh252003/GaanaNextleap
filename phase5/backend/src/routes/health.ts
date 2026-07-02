import { Router, Request, Response, NextFunction } from "express";

declare module "express" {
  interface Request {
    requestId?: string;
  }
}

const router = Router();

router.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    phase: 5,
    message: "Gaana Discovery AI backend (Phase 5 – Production Ready) is running",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

export default router;
