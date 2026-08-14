const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "Name, email and password are required." });
    if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters." });

    const [existing] = await db.query("SELECT id FROM users WHERE email=?", [email]);
    if (existing.length) return res.status(409).json({ message: "An account with this email already exists." });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      "INSERT INTO users (name,email,password_hash,phone) VALUES (?,?,?,?)",
      [name, email, hash, phone || null]
    );
    res.status(201).json({ message: "Registration successful.", userId: result.insertId });
  } catch (e) {
    res.status(500).json({ message: "Registration failed.", error: e.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query("SELECT * FROM users WHERE email=?", [email]);
    if (!rows.length) return res.status(401).json({ message: "Invalid email or password." });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: "Invalid email or password." });

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (e) {
    res.status(500).json({ message: "Login failed.", error: e.message });
  }
});

module.exports = router;
