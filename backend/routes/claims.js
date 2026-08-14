const express = require("express");
const db = require("../db");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.post("/", auth, async (req, res) => {
  try {
    const { item_id, message, verification_question, verification_answer } = req.body;
    if (!item_id || !message) {
      return res.status(400).json({ message: "Item and claim message are required." });
    }

    const [items] = await db.query("SELECT * FROM items WHERE id=?", [item_id]);
    if (!items.length) return res.status(404).json({ message: "Item not found." });
    if (items[0].user_id === req.user.id) {
      return res.status(400).json({ message: "You cannot claim your own report." });
    }
    if (items[0].status !== "active") {
      return res.status(400).json({ message: "This item is no longer active." });
    }

    // ✅ FIX: Prevent duplicate pending claims from the same user
    const [existing] = await db.query(
      "SELECT id FROM claims WHERE item_id=? AND claimant_id=? AND status='pending'",
      [item_id, req.user.id]
    );
    if (existing.length) {
      return res.status(409).json({ message: "You already have a pending claim for this item." });
    }

    const [result] = await db.query(
      `INSERT INTO claims (item_id, claimant_id, message, verification_question, verification_answer)
       VALUES (?, ?, ?, ?, ?)`,
      [item_id, req.user.id, message.trim(), verification_question || null, verification_answer || null]
    );

    await db.query(
      "INSERT INTO notifications (user_id, message) VALUES (?, ?)",
      [items[0].user_id, `A new claim was submitted for your item "${items[0].title}".`]
    );

    res.status(201).json({ message: "Claim submitted successfully.", claimId: result.insertId });
  } catch (e) {
    res.status(500).json({ message: "Could not submit claim.", error: e.message });
  }
});

router.get("/mine", auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*, i.title, i.type, u.name AS reporter_name
       FROM claims c
       JOIN items i ON i.id = c.item_id
       JOIN users u ON u.id = i.user_id
       WHERE c.claimant_id = ?
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: "Could not load claims.", error: e.message });
  }
});

router.get("/received", auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*, i.title, i.type, u.name AS claimant_name, u.email AS claimant_email
       FROM claims c
       JOIN items i ON i.id = c.item_id
       JOIN users u ON u.id = c.claimant_id
       WHERE i.user_id = ?
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: "Could not load received claims.", error: e.message });
  }
});

router.patch("/:id", auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid claim status." });
    }

    const [rows] = await db.query(
      `SELECT c.*, i.user_id AS owner_id, i.title
       FROM claims c JOIN items i ON i.id = c.item_id WHERE c.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Claim not found." });

    const claim = rows[0];
    if (claim.owner_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized." });
    }

    await db.query("UPDATE claims SET status=? WHERE id=?", [status, req.params.id]);
    if (status === "approved") {
      await db.query("UPDATE items SET status='returned' WHERE id=?", [claim.item_id]);
    }

    await db.query(
      "INSERT INTO notifications (user_id, message) VALUES (?, ?)",
      [claim.claimant_id, `Your claim for "${claim.title}" was ${status}.`]
    );

    res.json({ message: `Claim ${status}.` });
  } catch (e) {
    res.status(500).json({ message: "Could not update claim.", error: e.message });
  }
});

module.exports = router;
