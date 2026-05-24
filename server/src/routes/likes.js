import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  hasLiked,
  addLike,
  removeLike,
  incArticleLikesCount,
  getArticleById,
} from "../db.js";

const router = Router();

router.post("/:articleId", requireAuth, (req, res) => {
  const article = getArticleById(req.params.articleId);
  if (!article) return res.status(404).json({ success: false, error: "文章不存在" });

  const userId = req.user._id;
  const liked = !!hasLiked(req.params.articleId, userId);

  if (liked) {
    removeLike(req.params.articleId, userId);
    incArticleLikesCount(req.params.articleId, -1);
    res.json({ success: true, data: { liked: false } });
  } else {
    addLike(req.params.articleId, userId, new Date().toISOString());
    incArticleLikesCount(req.params.articleId, 1);
    res.json({ success: true, data: { liked: true } });
  }
});

export default router;
