// src/app.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createPaste, fetchPaste } from "./services/pasteService.js";
import { validateCreate } from "./utils/validate.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

// --- Health check ---
app.get("/api/healthz", async (req, res) => {
  try {
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// --- Create paste ---
app.post("/api/pastes", async (req, res) => {
  const errMsg = validateCreate(req.body);
  if (errMsg) return res.status(400).json({ error: errMsg });

  try {
    const paste = await createPaste(req.body);
    res.status(201).json({
      id: paste.id,
      url: paste.url, // relative URL
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- Fetch paste API (JSON) ---
app.get("/api/pastes/:id", async (req, res) => {
  try {
    const paste = await fetchPaste(req.params.id, req);
    if (!paste) return res.status(404).json({ error: "Paste not found" });

    res.json({
      content: paste.content,
      remaining_views: paste.remaining_views,
      expires_at: paste.expires_at,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// --- Fetch paste HTML view ---
app.get("/p/:id", async (req, res) => {
  try {
    const paste = await fetchPaste(req.params.id, req);
    if (!paste) return res.status(404).send("<h1>Paste not found</h1>");

    // Simple safe HTML rendering
    const safeContent = paste.content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    res.sendFile(path.join(__dirname, "views", "paste.html"));
    res.status(200).send(`<pre>${safeContent}</pre>`);
  } catch (err) {
    res.status(500).send("<h1>Internal server error</h1>");
  }
});

export default app;
