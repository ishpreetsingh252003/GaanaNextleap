import { Request, Response, NextFunction } from "express";

export const logger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const ts = new Date().toISOString();
  res.on("finish", () => {
    console.log(`[${ts}] ${req.method} ${req.path} → ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
};
