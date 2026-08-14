const express = require("express");
const multer = require("multer");
const path = require("path");
const db = require("../db");
const { auth } = require("../middleware/auth");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "..", "uploads")),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed."));
    }
    cb(null, true);
  }
});

function similarity(a, b) {
  const A = new Set((a || "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  const B = new Set((b || "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  if (!A.size || !B.size) return 0;
  let common = 0;
  for (const word of A) if (B.has(word)) common++;
  return Math.round((common / Math.max(A.size, B.size)) * 20);
}

function matchScore(lost, found) {
  let score = 0;
  if (lost.category.toLowerCase() === found.category.toLowerCase()) score += 30;
  if (lost.location.toLowerCase() === found.location.toLowerCase()) score += 30;
  const d1 = new Date(lost.event_date), d2 = new Date(found.event_date);
  const days = Math.abs((d1 - d2) / 86400000);
  if (days === 0) score += 20;
  else if (days <= 2) score += 15;
  else if (days <= 7) score += 8;
  score += similarity(`${lost.title} ${lost.description}`, `${found.title} ${found.description}`);
  return Math.min(score, 100);
}

// ✅ FIX: /mine/reports MUST come before /:id — otherwise Express treats "mine" as an id param
router.get("/mine/reports", auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM items WHERE user_id=? ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: "Could not load your reports.", error: e.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const { type, category, location, search, status = "active" } = req.query;
    let sql = `SELECT i.*, u.name AS reporter_name
               FROM items i JOIN users u ON u.id=i.user_id
               WHERE 1=1`;
    const params = [];

    if (type) { sql += " AND i.type=?"; params.push(type); }
    if (category) { sql += " AND i.category=?"; params.push(category); }
    if (location) { sql += " AND i.location LIKE ?"; params.push(`%${location}%`); }
    if (status !== "all") { sql += " AND i.status=?"; params.push(status); }
    if (search) {
      sql += " AND (i.title LIKE ? OR i.description LIKE ? OR i.location LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    sql += " ORDER BY i.created_at DESC LIMIT 100";

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: "Could not load items.", error: e.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid item ID." });
    const [rows] = await db.query(
      `SELECT i.*, u.name AS reporter_name, u.email AS reporter_email
       FROM items i JOIN users u ON u.id=i.user_id WHERE i.id=?`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: "Item not found." });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ message: "Could not load item.", error: e.message });
  }
});

router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const { type, title, category, description, location, event_date } = req.body;
    if (!type || !title || !category || !description || !location || !event_date) {
      return res.status(400).json({ message: "All required item fields must be completed." });
    }
    if (!["lost", "found"].includes(type)) {
      return res.status(400).json({ message: "Type must be 'lost' or 'found'." });
    }
    // Prevent future dates for lost/found items
    const today = new Date().toISOString().split("T")[0];
    if (event_date > today) {
      return res.status(400).json({ message: "Event date cannot be in the future." });
    }

    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    const [result] = await db.query(
      `INSERT INTO items (user_id, type, title, category, description, location, event_date, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, type, title.trim(), category, description.trim(), location.trim(), event_date, image_url]
    );
    res.status(201).json({ message: "Item reported successfully.", itemId: result.insertId });
  } catch (e) {
    res.status(500).json({ message: "Could not create report.", error: e.message });
  }
});

router.get("/:id/matches", async (req, res) => {
  // ✅ FIX: matches endpoint no longer requires auth — anyone browsing can see matches
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid item ID." });

    const [items] = await db.query("SELECT * FROM items WHERE id=?", [id]);
    if (!items.length) return res.status(404).json({ message: "Item not found." });

    const source = items[0];
    const opposite = source.type === "lost" ? "found" : "lost";
    const [candidates] = await db.query(
      "SELECT * FROM items WHERE type=? AND status='active' AND id<>? ORDER BY created_at DESC LIMIT 200",
      [opposite, source.id]
    );

    const matches = candidates
      .map(item => ({ ...item, match_score: matchScore(source, item) }))
      .filter(item => item.match_score >= 35)
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 10);

    res.json(matches);
  } catch (e) {
    res.status(500).json({ message: "Could not calculate matches.", error: e.message });
  }
});

router.patch("/:id/status", auth, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["active", "claimed", "returned", "closed"];
    if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid status." });

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid item ID." });

    const [rows] = await db.query("SELECT user_id FROM items WHERE id=?", [id]);
    if (!rows.length) return res.status(404).json({ message: "Item not found." });
    if (rows[0].user_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized." });
    }

    await db.query("UPDATE items SET status=? WHERE id=?", [status, id]);
    res.json({ message: "Status updated." });
  } catch (e) {
    res.status(500).json({ message: "Could not update status.", error: e.message });
  }
});

module.exports = router;
