import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("inspections.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year TEXT UNIQUE NOT NULL,
    site_location TEXT
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    status TEXT,
    comments TEXT,
    technician_name TEXT,
    date TEXT,
    signature TEXT,
    attachments TEXT, -- JSON string of attachment metadata
    FOREIGN KEY (project_id) REFERENCES projects(id)
  );
`);

try {
  db.exec("ALTER TABLE projects ADD COLUMN site_location TEXT");
} catch (e) {
  // Column already exists
}


async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.get("/api/projects", (req, res) => {
    const projects = db.prepare("SELECT * FROM projects ORDER BY year DESC").all();
    res.json(projects);
  });

  app.post("/api/projects", (req, res) => {
    const { year, site_location } = req.body;
    try {
      const info = db.prepare("INSERT INTO projects (year, site_location) VALUES (?, ?)").run(year, site_location || null);
      res.json({ id: info.lastInsertRowid, year, site_location });
    } catch (err) {
      res.status(400).json({ error: "Project already exists" });
    }
  });

  app.get("/api/projects/:id/reports", (req, res) => {
    const reports = db.prepare("SELECT * FROM reports WHERE project_id = ?").all(req.params.id);
    res.json(reports);
  });

  app.post("/api/reports", (req, res) => {
    const { project_id, item_id, status, comments, technician_name, date, signature, attachments } = req.body;
    
    // Check if report exists for this item in this project
    const existing = db.prepare("SELECT id FROM reports WHERE project_id = ? AND item_id = ?").get(project_id, item_id);
    
    if (existing) {
      db.prepare(`
        UPDATE reports 
        SET status = ?, comments = ?, technician_name = ?, date = ?, signature = ?, attachments = ?
        WHERE id = ?
      `).run(status, comments, technician_name, date, signature, JSON.stringify(attachments), existing.id);
      res.json({ id: existing.id });
    } else {
      const info = db.prepare(`
        INSERT INTO reports (project_id, item_id, status, comments, technician_name, date, signature, attachments)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(project_id, item_id, status, comments, technician_name, date, signature, JSON.stringify(attachments));
      res.json({ id: info.lastInsertRowid });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
