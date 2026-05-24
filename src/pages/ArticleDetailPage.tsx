import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import CommentSection from "../components/CommentSection";
import LikeButton from "../components/LikeButton";
import type { Article } from "../types";

// Configure marked for safe rendering
marked.setOptions({
  breaks: true,
  gfm: true,
});

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getArticle, deleteArticle, hasLiked, toggleLike } = useApp();
  const { isAdmin } = useAuth();

  const [article, setArticle] = useState<Article | null>(null);
  const [liked, setLiked] = useState(false);
  const [currentLikes, setCurrentLikes] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const a = await getArticle(id);
        setArticle(a || null);
        if (a) {
          const liked = await hasLiked(id);
          setLiked(liked);
          setCurrentLikes(a.likesCount);
        }
      } catch {
        setArticle(null);
      }
    })();
  }, [id, getArticle, hasLiked]);

  const handleLikeToggle = async () => {
    if (!id) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    setCurrentLikes((c) => (wasLiked ? c - 1 : c + 1));
    await toggleLike(id);
  };

  const handleDelete = async () => {
    if (!id || !article) return;
    if (window.confirm(`确定删除「${article.title}」吗？`)) {
      setDeleting(true);
      await deleteArticle(id);
      navigate("/");
    }
  };

  // Render markdown content safely
  const renderedContent = useMemo(() => {
    if (!article?.content) return "";
    const rawHtml = marked.parse(article.content, { async: false }) as string;
    return DOMPurify.sanitize(rawHtml, {
      ADD_ATTR: ["target", "rel"],
    });
  }, [article?.content]);

  if (!article) {
    return (
      <div className="bg-white box-shadow-wrapper rounded-lg p-14 text-center slide-down-in">
        <i className="fa fa-file-text-o text-4xl text-ink-300 mb-4" />
        <p className="font-serif text-ink-500 text-lg">文章不存在或已被删除</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 border border-navy-900 text-navy-900 rounded-lg font-serif text-sm hover:bg-navy-900 hover:text-white transition-all"
        >
          <i className="fa fa-arrow-left" /> 返回首页
        </Link>
      </div>
    );
  }

  const date = new Date(article.createdAt).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return (
    <>
      <article className="post-list-box post box-shadow-wrapper slide-down-in">
        <div className="article-wrapper bg-color">
          {/* Header */}
          <section className="post-header">
            <h1 className="post-title text-xl md:text-2xl">
              {article.title}
            </h1>
            <div className="post-meta">
              <span className="meta-item">
                <i className="fa fa-calendar-o" /> 发布于 <span>{date}</span>
                <span className="post-meta-divider">|</span>
              </span>
              <span className="meta-item">
                <i className="fa fa-user" /> {article.authorName}
                <span className="post-meta-divider">|</span>
              </span>
              <span className="meta-item">
                <i className="fa fa-heart" /> {currentLikes}
                <span className="post-meta-divider">|</span>
              </span>
              <span className="meta-item">
                <i className="fa fa-comment" /> {article.commentsCount}
              </span>
            </div>

            {/* Tags */}
            {article.tags.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {article.tags.map((tag) => (
                  <span key={tag} className="tag text-[11px]">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Admin controls */}
            {isAdmin && (
              <div className="mt-3 flex items-center gap-2">
                <Link
                  to={`/write/${article._id}`}
                  className="btn-ghost text-sm"
                >
                  <i className="fa fa-pencil-square-o" /> 编辑
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="btn-ghost text-sm text-rust-600 hover:text-rust-700"
                >
                  <i className="fa fa-trash" /> {deleting ? "删除中..." : "删除"}
                </button>
              </div>
            )}
          </section>

          {/* Cover image */}
          {article.coverImage && (
            <div className="-mx-8 mb-6 overflow-hidden max-h-96 rounded-sm">
              <img
                src={article.coverImage}
                alt={article.title}
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {/* Content - rendered markdown */}
          <div className="post-body">
            <div
              className="prose-blog drop-cap"
              dangerouslySetInnerHTML={{ __html: renderedContent }}
            />
          </div>

          {/* Like button */}
          <div className="mt-8 flex justify-center">
            <LikeButton
              articleId={article._id}
              likesCount={currentLikes}
              hasLiked={liked}
              onToggle={handleLikeToggle}
            />
          </div>

          {/* Back button */}
          <div className="mt-4 text-center">
            <Link
              to="/"
              className="font-serif text-sm text-ink-500 hover:text-navy-900 transition-colors inline-flex items-center gap-1.5"
            >
              <i className="fa fa-arrow-left" /> 返回首页
            </Link>
          </div>
        </div>
      </article>

      <CommentSection articleId={article._id} />
    </>
  );
}
