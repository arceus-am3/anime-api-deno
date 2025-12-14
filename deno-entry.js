// deno-entry.js
// --- MAIN DENO ENTRY ---

import express from "npm:express@4.18.2";
import cors from "npm:cors@2.8.5";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { createApiRoutes } from "./src/routes/apiRoutes.js";

// dotenv (Deno supports .env auto loading using `--allow-env`)
import "npm:dotenv@16.4.5/config";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup CORS (same as server.js)
const allowedOrigins = Deno.env.get("ALLOWED_ORIGINS")?.split(",");
app.use(
  cors({
    origin: allowedOrigins?.includes("*") ? "*" : allowedOrigins || [],
    methods: ["GET"],
  })
);

// static folder serve (public/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));

// JSON helpers
const jsonResponse = (res, data, status = 200) =>
  res.status(status).json({ success: true, results: data });

const jsonError = (res, message = "Internal server error", status = 500) =>
  res.status(status).json({ success: false, message });

// Register all API routes
createApiRoutes(app, jsonResponse, jsonError);
// deno-entry.js (या server start file)
app.get('/api/ping', (req, res) => {
  res.setHeader('content-type', 'application/json');
  res.send ? res.send({ ok: true }) : res.end(JSON.stringify({ ok: true }));
});

// Health check
app.get("/", (req, res) => {
  res.send("Anime API running on Deno Deploy!");
});

// Port
const PORT = Number(Deno.env.get("PORT") || 8000);
app.listen(PORT, () => console.log(`Deno API running at ${PORT}`));
