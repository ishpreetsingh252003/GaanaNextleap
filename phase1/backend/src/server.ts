import app from "./app";

const PORT = parseInt(process.env.PORT || "3001", 10);

const server = app.listen(PORT, () => {
  console.log(`✅ Gaana Discovery AI backend running on port ${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || "development"}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(
    `   Allowed origin: ${process.env.FRONTEND_URL || "http://localhost:3000"}`
  );
});

// Handle unexpected errors gracefully so the process doesn't crash silently
process.on("unhandledRejection", (reason) => {
  console.error("[Unhandled Rejection]", reason);
  server.close(() => process.exit(1));
});

process.on("uncaughtException", (error) => {
  console.error("[Uncaught Exception]", error);
  server.close(() => process.exit(1));
});

export default server;
