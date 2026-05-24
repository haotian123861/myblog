import { Router } from "express";
import crypto from "crypto";
import { requireAuth } from "../middleware/auth.js";
import {
  getCommentsByArticle,
  getCommentById,
  createComment,
  deleteComment,
  incArticleCommentsCount,
} from "../db.js";

const router = Router();

router.get("/article/:articleId", (req, res) => {
  const comments = getCommentsByArticle(req.params.articleId).map(mapComment);
  res.json({ success: true, data: comments });
});

router.post("/article/:articleId", requireAuth, (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ success: false, error: "内容不能为空" });

  const now = new Date().toISOString();
  const _id = crypto.randomUUID();

  createComment({
    _id,
    articleId: req.params.articleId,
    authorId: req.user._id,
    authorName: req.user.nickname,
    avatarUrl: req.user.avatar_url,
    content,
    createdAt: now,
  });

  incArticleCommentsCount(req.params.articleId, 1);
  res.json({ success: true, data: { _id } });
});

router.delete("/:id", requireAuth, (req, res) => {
  const comment = getCommentById(req.params.id);
  if (!comment) return res.status(404).json({ success: false, error: "评论不存在" });

  const isOwner = comment.author_id === req.user._id;
  const isAdmin = req.user.role === "admin";
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ success: false, error: "无权删除" });
  }

  deleteComment(req.params.id);
  incArticleCommentsCount(comment.article_id, -1);
  res.json({ success: true });
});

function mapComment(row) {
  return {
    _id: row._id,
    articleId: row.article_id,
    authorId: row.author_id,
    authorName: row.author_name,
    avatarUrl: row.avatar_url,
    content: row.content,
    createdAt: row.created_at,
  };
}

export default router;
