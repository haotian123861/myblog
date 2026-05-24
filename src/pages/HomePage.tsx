import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

const rankColors = ["#c0392b", "#a05030", "#706050"];

export default function HomePage() {
  const { articles, loading, files, fileCategories, topics } = useApp();

  const sortedArticles = useMemo(() => [...articles].reverse(), [articles]);

  const hotArticles = useMemo(
    () => [...sortedArticles].sort((a, b) => b.likesCount - a.likesCount).slice(0, 3),
    [sortedArticles]
  );

  const recommendedFiles = useMemo(
    () => [...files].sort((a, b) => b.downloadCount - a.downloadCount).slice(0, 5),
    [files]
  );

  const hotTopics = useMemo(
    () =>
      [...topics]
        .sort((a, b) => b.likesCount + b.commentsCount * 2 - (a.likesCount + a.commentsCount * 2))
        .slice(0, 5),
    [topics]
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-navy-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const noContent = sortedArticles.length === 0 && files.length === 0 && topics.length === 0;

  return (
    <div className="slide-down-in space-y-8">
      {/* ===== Hot Articles ===== */}
      {hotArticles.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="font-display text-lg font-bold text-navy-900 tracking-wide">
              热门文章
            </h2>
            <span className="w-px h-4 bg-ink-200" />
            <span className="font-serif text-sm text-ink-400">点赞最多</span>
            <Link
              to="/articles"
              className="ml-auto font-serif text-sm text-navy-600 hover:text-navy-900 transition-colors"
            >
              查看全部 &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {hotArticles.map((article, index) => (
              <Link
                key={article._id}
                to={`/article/${article._id}`}
                className="group block bg-ink-50 rounded-xl border border-ink-200/70 shadow-sm hover:shadow-md hover:border-navy-300 transition-all duration-300 overflow-hidden"
              >
                <div
                  className="h-1.5"
                  style={{ background: `linear-gradient(90deg, ${rankColors[index]}, ${rankColors[index]}88)` }}
                />
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold text-white"
                      style={{ background: rankColors[index] }}
                    >
                      {index + 1}
                    </span>
                    <span className="font-mono text-[10px] text-ink-400 uppercase tracking-wider">
                      {article.tags?.[0] || "随笔"}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-ink-800 text-base leading-snug mb-2 group-hover:text-navy-700 transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="font-serif text-sm text-ink-500 leading-relaxed mb-4 line-clamp-2">
                    {article.summary || article.content?.slice(0, 120) || ""}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-ink-400 pt-3 border-t border-ink-100">
                    <span className="flex items-center gap-1">
                      <i className="fa fa-heart-o" />
                      {article.likesCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <i className="fa fa-comment-o" />
                      {article.commentsCount}
                    </span>
                    <span className="ml-auto font-mono text-[10px]">
                      {new Date(article.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ===== Recommended Files ===== */}
      {recommendedFiles.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="font-display text-lg font-bold text-navy-900 tracking-wide">
              推荐文件
            </h2>
            <span className="w-px h-4 bg-ink-200" />
            <span className="font-serif text-sm text-ink-400">下载最多</span>
            <Link
              to="/files"
              className="ml-auto font-serif text-sm text-navy-600 hover:text-navy-900 transition-colors"
            >
              查看全部 &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {recommendedFiles.map((file) => {
              const cat = fileCategories.find((c) => c._id === file.categoryId);
              return (
                <div
                  key={file._id}
                  className="bg-ink-50 border border-ink-200/60 rounded-lg p-4 hover:shadow-sm hover:border-navy-300 transition-all duration-300 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-navy-100 flex items-center justify-center text-lg text-navy-600 mb-3 group-hover:bg-navy-200 transition-colors">
                    <i className="fa fa-file-o" />
                  </div>
                  <p className="text-sm font-semibold text-ink-700 truncate mb-1" title={file.originalName}>
                    {file.originalName}
                  </p>
                  <div className="flex items-center gap-1 text-[11px] text-ink-400 mb-1">
                    <span>{formatSize(file.size)}</span>
                    {cat && (
                      <>
                        <span className="text-ink-200">/</span>
                        <span>{cat.name}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-ink-400">
                    <i className="fa fa-download" />
                    <span>{file.downloadCount} 下载</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ===== Hot Topics ===== */}
      {hotTopics.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="font-display text-lg font-bold text-navy-900 tracking-wide">
              热门话题
            </h2>
            <span className="w-px h-4 bg-ink-200" />
            <span className="font-serif text-sm text-ink-400">讨论最多</span>
            <Link
              to="/chat"
              className="ml-auto font-serif text-sm text-navy-600 hover:text-navy-900 transition-colors"
            >
              查看全部 &rarr;
            </Link>
          </div>

          <div className="space-y-2">
            {hotTopics.map((topic, index) => (
              <Link
                key={topic._id}
                to="/chat"
                className="flex items-center gap-3 bg-ink-50 border border-ink-200/60 rounded-lg px-4 py-3.5 hover:bg-ink-100 hover:border-navy-300 transition-all duration-200 group"
              >
                <span
                  className="w-5 h-5 rounded text-xs font-bold text-white flex items-center justify-center flex-shrink-0"
                  style={{ background: rankColors[index] }}
                >
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-ink-700 group-hover:text-navy-800 transition-colors">
                    {topic.title}
                  </span>
                  <p className="text-xs text-ink-400 truncate mt-0.5">{topic.content}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-ink-400 flex-shrink-0">
                  <span className="flex items-center gap-1">
                    <i className="fa fa-heart-o" />
                    {topic.likesCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="fa fa-comment-o" />
                    {topic.commentsCount}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ===== Empty state ===== */}
      {noContent && (
        <div className="bg-ink-50 border border-ink-200/60 rounded-xl p-14 text-center">
          <i className="fa fa-pencil-square-o text-5xl text-ink-300 mb-4" />
          <p className="font-serif text-ink-500 text-lg">还没有分享内容</p>
          <p className="font-serif text-ink-400 text-sm mt-2">等待第一篇学习笔记的诞生</p>
        </div>
      )}
    </div>
  );
}
