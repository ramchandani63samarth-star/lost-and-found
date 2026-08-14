const express = require("express");
const db = require("../db");
const { auth, adminOnly } = require("../middleware/auth");

const router = express.Router();

router.use(auth, adminOnly);

router.get("/stats", async (req, res) => {
  try {
    const [[users]] = await db.query("SELECT COUNT(*) AS count FROM users");
    const [[lost]] = await db.query("SELECT COUNT(*) AS count FROM items WHERE type='lost'");
    const [[found]] = await db.query("SELECT COUNT(*) AS count FROM items WHERE type='found'");
    const [[returned]] = await db.query("SELECT COUNT(*) AS count FROM items WHERE status='returned'");
    const [[pending]] = await db.query("SELECT COUNT(*) AS count FROM claims WHERE status='pending'");
    res.json({ users: users.count, lost: lost.count, found: found.count, returned: returned.count, pending: pending.count });
  } catch (e) {
    res.status(500).json({ message: "Could not load statistics.", error: e.message });
  }
});

router.get("/users", async (req, res) => {
  const [rows] = await db.query("SELECT id,name,email,phone,role,created_at FROM users ORDER BY created_at DESC");
  res.json(rows);
});

router.get("/items", async (req, res) => {
  const [rows] = await db.query(
    `SELECT i.*, u.name AS reporter_name, u.email AS reporter_email
     FROM items i JOIN users u ON u.id=i.user_id ORDER BY i.created_at DESC`
  );
  res.json(rows);
});

router.get("/claims", async (req, res) => {
  const [rows] = await db.query(
    `SELECT c.*, i.title, i.type, u.name AS claimant_name, u.email AS claimant_email
     FROM claims c JOIN items i ON i.id=c.item_id JOIN users u ON u.id=c.claimant_id
     ORDER BY c.created_at DESC`
  );
  res.json(rows);
});

router.delete("/items/:id", async (req, res) => {
  await db.query("DELETE FROM items WHERE id=?", [req.params.id]);
  res.json({ message: "Report deleted." });
});

module.exports = router;
