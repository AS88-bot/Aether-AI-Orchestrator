import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory storage (for demo purposes, could be replaced with a database)
  let tasks: any[] = [];
  let events: any[] = [];
  let notes: any[] = [];

  // API Routes
  app.post("/api/create-task", (req, res) => {
    const task = { id: Math.random().toString(36).substr(2, 9), ...req.body, completed: false, createdAt: Date.now() };
    tasks.push(task);
    res.json({ result: `Task "${task.title}" created successfully.`, task });
  });

  app.get("/api/get-tasks", (req, res) => {
    res.json(tasks);
  });

  app.post("/api/schedule-event", (req, res) => {
    const event = { id: Math.random().toString(36).substr(2, 9), ...req.body, createdAt: Date.now() };
    events.push(event);
    res.json({ result: `Event "${event.title}" scheduled for ${event.datetime}.`, event });
  });

  app.get("/api/get-events", (req, res) => {
    res.json(events);
  });

  app.post("/api/save-note", (req, res) => {
    const note = { id: Math.random().toString(36).substr(2, 9), ...req.body, createdAt: Date.now() };
    notes.push(note);
    res.json({ result: "Note saved successfully.", note });
  });

  app.get("/api/get-notes", (req, res) => {
    res.json(notes);
  });

  app.delete("/api/tasks/:id", (req, res) => {
    tasks = tasks.filter(t => t.id !== req.params.id);
    res.json({ success: true });
  });

  app.patch("/api/tasks/:id", (req, res) => {
    tasks = tasks.map(t => t.id === req.params.id ? { ...t, ...req.body } : t);
    res.json({ success: true });
  });

  app.delete("/api/events/:id", (req, res) => {
    events = events.filter(e => e.id !== req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/notes/:id", (req, res) => {
    notes = notes.filter(n => n.id !== req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
