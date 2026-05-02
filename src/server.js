import http from "http";
import app from "./app.js";
import { env } from "./config/env.js";

const server = http.createServer(app);

server.listen(env.port, () => {
  console.log(`${env.appName} running on http://localhost:${env.port}`);
});

server.on("error", (error) => {
  console.error("Server failed to start:", error);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});