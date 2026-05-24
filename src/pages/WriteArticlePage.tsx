import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import ImageUploader from "../components/ImageUploader";

export default function WriteArticlePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getArticle, createArticle, updateArticle } = useApp();
  const { isAdmin } = useAuth();

  const isEditing = !!id;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [tagsStr, setTagsStr] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEditing || !id) return;
    (async () => {
      const article = await getArticle(id);
      if (!article) {
        navigate("/");
        return;
      }
      // Check author
      if (!isAdmin) {
        navigate("/");
        return;
      }
      setTitle(article.title);
      setContent(article.content);
      setSummary(article.summary);
      setTagsStr(article.tags.join(", "));
      setCoverImage(article.coverImage || "");
    })();
  }, [id, isEditing, getArticle, navigate, isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSaving(true);

    const tags = tagsStr
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      if (isEditing && id) {
        updateArticle(id, { title, content, summary, tags, coverImage });
        navigate(`/article/${id}`);
      } else {
        const newId = createArticle({
          title,
          content,
          summary,
          tags,
          coverImage: coverImage || undefined,
        });
        navigate(`/article/${newId}`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-50">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-navy-900">
            {isEditing ? "编辑文章" : "撰写新文章"}
          </h1>
          <p className="font-serif text-ink-500 mt-2">
            {isEditing ? "修改你的文字" : "记录你的思考"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Cover image */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-ink-500 mb-3">
              封面图片
            </label>
            <ImageUploader
              onUpload={setCoverImage}
              currentImage={coverImage}
            />
          </div>

          {/* Title */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-ink-500 mb-3">
              标题
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field text-2xl font-display font-bold"
              placeholder="输入文章标题..."
              required
            />
          </div>

          {/* Summary */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-ink-500 mb-3">
              摘要
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="input-field resize-none font-serif"
              rows={2}
              placeholder="简短描述文章内容..."
            />
          </div>

          {/* Content */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-ink-500 mb-3">
              <span>正文（支持 Markdown 语法）</span>
              <span className="ml-2 text-ink-300">## 标题 · **粗体** · 段落用空行分隔</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[400px] p-6 bg-white border-2 border-ink-200 rounded-2xl font-serif text-ink-800 leading-relaxed focus:outline-none focus:border-gold-400 focus:shadow-lg focus:shadow-gold-500/10 transition-all resize-y"
              placeholder="开始写作..."
              required
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-ink-500 mb-3">
              标签（用逗号分隔）
            </label>
            <input
              type="text"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              className="input-field font-serif"
              placeholder="随笔, 生活, 思考"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-ink-100 gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-ghost w-full sm:w-auto justify-center"
            >
              <i className="fa-regular fa-arrow-left" />
              返回
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim() || !content.trim()}
              className="btn-primary w-full sm:w-auto justify-center"
            >
              {saving ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <i className="fa-regular fa-paper-plane" />
                  {isEditing ? "更新文章" : "发布文章"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
