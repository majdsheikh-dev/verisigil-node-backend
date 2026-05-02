import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    message: "Verisigil Node backend is running",
  });
});

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

router.get("/ready", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: "ready",
      database: "connected",
    });
  } catch (error) {
    res.status(503).json({
      status: "not_ready",
      database: "disconnected",
      message: error.message,
    });
  }
});

export default router;