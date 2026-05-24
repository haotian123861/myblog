import { Router } from "express";
import crypto from "crypto";
import { requireAuth } from "../middleware/auth.js";
import {
  getTopics,
  getTopicById,
  createTopic,
  deleteTopic,
  incTopicCommentsCount,
  incTopicLikesCount,
  getTopicComments,
  getTopicCommentById,
  createTopicComment,
  deleteTopicComment,
  hasTopicLiked,
  addTopicLike,
  removeTopicLike,
} from "../db.js";

const router = Router();

// ─── Topics ───────────────────────────────────────────────
router.get("/", (req, res) => {
  const topics = getTopics().map(mapTopic);
  res.json({ success: true, data: topics });
});

router.post("/", requireAuth, (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ success: false, error: "标题和内容不能为空" });
  }
  const _id = crypto.randomUUID();
  createTopic({
    _id, title, content,
    authorId: req.user._id,
    authorName: req.user.nickname,
    createdAt: new Date().toISOString(),
  });
  res.json({ success: true, data: { _id } });
});

router.delete("/:id", requireAuth, (req, res) => {
  const topic = getTopicById(req.params.id);
  if (!topic) return res.status(404).json({ success: false, error: "话题不存在" });

  const isOwner = topic.author_id === req.user._id;
  const isAdmin = req.user.role === "admin";
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ success: false, error: "无权删除" });
  }

  deleteTopic(req.params.id);
  res.json({ success: true });
});

// ─── Topic Comments ───────────────────────────────────────
router.get("/:id/comments", (req, res) => {
  const comments = getTopicComments(req.params.id).map(mapTopicComment);
  res.json({ success: true, data: comments });
});

router.post("/:id/comments", requireAuth, (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ success: false, error: "内容不能为空" });

  const _id = crypto.randomUUID();
  createTopicComment({
    _id,
    topicId: req.params.id,
    authorId: req.user._id,
    authorName: req.user.nickname,
    content,
    createdAt: new Date().toISOString(),
  });
  incTopicCommentsCount(req.params.id, 1);
  res.json({ success: true, data: { _id } });
});

router.delete("/topic-comments/:id", requireAuth, (req, res) => {
  const comment = getTopicCommentById(req.params.id);
  if (!comment) return res.status(404).json({ success: false, error: "评论不存在" });

  const isOwner = comment.author_id === req.user._id;
  const isAdmin = req.user.role === "admin";
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ success: false, error: "无权删除" });
  }

  deleteTopicComment(req.params.id);
  incTopicCommentsCount(comment.topic_id, -1);
  res.json({ success: true });
});

// ─── Topic Likes ──────────────────────────────────────────
router.post("/:id/like", requireAuth, (req, res) => {
  const topic = getTopicById(req.params.id);
  if (!topic) return res.status(404).json({ success: false, error: "话题不存在" });

  const userId = req.user._id;
  const liked = !!hasTopicLiked(req.params.id, userId);

  if (liked) {
    removeTopicLike(req.params.id, userId);
    incTopicLikesCount(req.params.id, -1);
    res.json({ success: true, data: { liked: false } });
  } else {
    addTopicLike(req.params.id, userId, new Date().toISOString());
    incTopicLikesCount(req.params.id, 1);
    res.json({ success: true, data: { liked: true } });
  }
});

function mapTopic(row) {
  return {
    _id: row._id,
    title: row.title,
    content: row.content,
    authorId: row.author_id,
    authorName: row.author_name,
    likesCount: row.likes_count,
    commentsCount: row.comments_count,
    createdAt: row.created_at,
  };
}

function mapTopicComment(row) {
  return {
    _id: row._id,
    topicId: row.topic_id,
    authorId: row.author_id,
    authorName: row.author_name,
    content: row.content,
    createdAt: row.created_at,
  };
}

export default router;
