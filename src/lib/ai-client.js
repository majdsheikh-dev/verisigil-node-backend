import axios from "axios";
import { env } from "../config/env.js";

// Keep all AI calls behind this client so the backend remains the only service the frontend talks to.
export const aiClient = axios.create({
  baseURL: env.aiServiceUrl,
  timeout: 30000,
});
