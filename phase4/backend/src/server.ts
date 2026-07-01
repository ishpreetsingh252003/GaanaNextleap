import app from "./app";

const PORT = parseInt(process.env.PORT || "3001", 10);

const server = app.listen(PORT, () => {
  console.log(`✅ Gaana Discovery AI (Phase 4) backend running on port ${PORT}`);
  console.log(`   Health : http://localhost:${PORT}/api/health`);
  console.log(`   Scrape : POST http://localhost:${PORT}/api/reviews/scrape`);
  console.log(`   Sources: GET  http://localhost:${PORT}/api/reviews/sources`);
  console.log(`   Analysis: POST http://localhost:${PORT}/api/analysis/review-analysis`);
  console.log(`   Discovery: POST http://localhost:${PORT}/api/discovery-agent`);
});

process.on("unhandledRejection", (reason) => {
  console.error("[Unhandled Rejection]", reason);
  server.close(() => process.exit(1));
});

process.on("uncaughtException", (error) => {
  console.error("[Uncaught Exception]", error);
  server.close(() => process.exit(1));
});

export default server;
