import { Router } from "express";
import crypto from "crypto";
import { requireAuth } from "../middleware/auth.js";
import {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
} from "../db.js";

const router = Router();

router.get("/", (req, res) => {
  const articles = getArticles().map(mapArticle);
  res.json({ success: true, data: articles });
});

router.get("/:id", (req, res) => {
  const article = getArticleById(req.params.id);
  if (!article) return res.status(404).json({ success: false, error: "文章不存在" });
  res.json({ success: true, data: mapArticle(article) });
});

router.post("/", requireAuth, (req, res) => {
  const { title, content, summary, tags, coverImage } = req.body;
  if (!title || !content) {
    return res.status(400).json({ success: false, error: "标题和内容不能为空" });
  }
  const now = new Date().toISOString();
  const _id = crypto.randomUUID();
  createArticle({
    _id,
    title,
    content,
    summary: summary || "",
    tags: tags || [],
    coverImage: coverImage || undefined,
    authorId: req.user._id,
    authorName: req.user.nickname,
    createdAt: now,
    updatedAt: now,
  });
  res.json({ success: true, data: { _id } });
});

router.put("/:id", requireAuth, (req, res) => {
  const article = getArticleById(req.params.id);
  if (!article) return res.status(404).json({ success: false, error: "文章不存在" });

  const { title, content, summary, tags, coverImage } = req.body;
  updateArticle(req.params.id, {
    title, content, summary, tags, coverImage,
    updatedAt: new Date().toISOString(),
  });
  res.json({ success: true });
});

router.delete("/:id", requireAuth, (req, res) => {
  const article = getArticleById(req.params.id);
  if (!article) return res.status(404).json({ success: false, error: "文章不存在" });

  const isOwner = article.author_id === req.user._id;
  const isAdmin = req.user.role === "admin";
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ success: false, error: "无权删除" });
  }

  deleteArticle(req.params.id);
  res.json({ success: true });
});

function mapArticle(row) {
  if (!row) return null;
  return {
    _id: row._id,
    title: row.title,
    content: row.content,
    summary: row.summary,
    coverImage: row.cover_image,
    tags: JSON.parse(row.tags || "[]"),
    authorId: row.author_id,
    authorName: row.author_name,
    likesCount: row.likes_count,
    commentsCount: row.comments_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default router;
