import { Router } from "express";
import crypto from "crypto";
import { requireAuth } from "../middleware/auth.js";
import { getMessages, createMessage } from "../db.js";

const router = Router();

router.get("/", (req, res) => {
  const msgs = getMessages().map((m) => ({
    _id: m._id,
    content: m.content,
    authorId: m.author_id,
    authorName: m.author_name,
    createdAt: m.created_at,
  }));
  res.json({ success: true, data: msgs });
});

router.post("/", requireAuth, (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ success: false, error: "内容不能为空" });

  const _id = crypto.randomUUID();
  createMessage({
    _id,
    content,
    authorId: req.user._id,
    authorName: req.user.nickname,
    createdAt: new Date().toISOString(),
  });
  res.json({ success: true, data: { _id } });
});

export default router;
