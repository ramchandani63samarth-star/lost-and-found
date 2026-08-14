const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const itemRoutes = require("./routes/items");
const claimRoutes = require("./routes/claims");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 5000;
const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadDir));

app.get("/api/health", (req, res) =>
  res.json({ status: "ok", project: "Community Lost & Found", time: new Date().toISOString() })
);

app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/admin", adminRoutes);

// 404 for unknown API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({ message: "API route not found." });
});

// Global error handler — also catches multer errors
app.use((err, req, res, next) => {
  console.error("[ERROR]", err.message);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "Image must be under 5MB." });
  }
  if (err.message === "Only image files are allowed.") {
    return res.status(400).json({ message: err.message });
  }
  res.status(500).json({ message: "Unexpected server error." });
});

app.listen(PORT, () => console.log(`✅ API running → http://localhost:${PORT}`));
