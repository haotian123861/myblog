import { Router } from "express";
import crypto from "crypto";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { requireAuth } from "../middleware/auth.js";
import {
  getFileCategories,
  createFileCategory,
  deleteFileCategory,
  getFiles,
  getFileById,
  createFileRecord,
  incrementFileDownloadCount,
  deleteFileRecord,
} from "../db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, "..", "..", "uploads"));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB

const router = Router();

// ─── File Categories ──────────────────────────────────────
router.get("/categories", (req, res) => {
  const cats = getFileCategories().map((c) => ({
    _id: c._id,
    name: c.name,
    createdAt: c.created_at,
  }));
  res.json({ success: true, data: cats });
});

router.post("/categories", requireAuth, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, error: "名称不能为空" });
  const _id = crypto.randomUUID();
  createFileCategory({ _id, name, createdAt: new Date().toISOString() });
  res.json({ success: true, data: { _id } });
});

router.delete("/categories/:id", requireAuth, (req, res) => {
  deleteFileCategory(req.params.id);
  res.json({ success: true });
});

// ─── Files ────────────────────────────────────────────────
router.get("/", (req, res) => {
  const list = getFiles().map(mapFile);
  res.json({ success: true, data: list });
});

router.post("/upload", requireAuth, upload.single("file"), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ success: false, error: "请选择文件" });

  const _id = crypto.randomUUID();
  const { categoryId } = req.body;

  createFileRecord({
    _id,
    originalName: file.originalname,
    storedPath: file.filename,
    size: file.size,
    categoryId: categoryId || "",
    uploaderId: req.user._id,
    uploaderName: req.user.nickname,
    createdAt: new Date().toISOString(),
  });

  const record = getFileById(_id);
  res.json({ success: true, data: mapFile(record) });
});

router.post("/:id/download", (req, res) => {
  const record = getFileById(req.params.id);
  if (!record) return res.status(404).json({ success: false, error: "文件不存在" });
  incrementFileDownloadCount(req.params.id);
  res.json({ success: true, data: { url: `/uploads/${record.stored_path}` } });
});

router.delete("/:id", requireAuth, (req, res) => {
  const record = getFileById(req.params.id);
  if (!record) return res.status(404).json({ success: false, error: "文件不存在" });
  try { fs.unlinkSync(path.join(uploadDir, record.stored_path)); } catch { /* ignore */ }
  deleteFileRecord(req.params.id);
  res.json({ success: true });
});

function mapFile(row) {
  return {
    _id: row._id,
    originalName: row.original_name,
    storedPath: row.stored_path,
    size: row.size,
    categoryId: row.category_id || "",
    uploaderId: row.uploader_id,
    uploaderName: row.uploader_name,
    downloadCount: row.download_count,
    createdAt: row.created_at,
  };
}

export default router;
