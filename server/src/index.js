import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { initDatabase, seedUsers } from "./db.js";
import authRoutes from "./routes/auth.js";
import articleRoutes from "./routes/articles.js";
import commentRoutes from "./routes/comments.js";
import likeRoutes from "./routes/likes.js";
import messageRoutes from "./routes/messages.js";
import fileRoutes from "./routes/files.js";
import topicRoutes from "./routes/topics.js";
import adminRoutes from "./routes/admin.js";
import aiRoutes from "./routes/ai.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize database
initDatabase();
seedUsers();

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads"));

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Serve uploaded files
app.use("/uploads", express.static(UPLOAD_DIR));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/topics", topicRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai", aiRoutes);

// Serve frontend static files in production
const distPath = path.resolve(__dirname, "..", "..", "dist");
app.use(express.static(distPath));
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, error: err.message || "服务器内部错误" });
});

app.listen(PORT, () => {
  console.log(`Blog server running at http://localhost:${PORT}`);
  console.log(`Upload directory: ${UPLOAD_DIR}`);
});
