import { Router, Request, Response } from "express";

const router = Router();

router.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    phase: 4,
    message: "Gaana Discovery AI backend (Phase 4 – Music Discovery Agent) is running",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

export default router;
