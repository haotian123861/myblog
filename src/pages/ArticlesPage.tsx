import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import ArticleCard from "../components/ArticleCard";

const PAGE_SIZE = 5;

export default function ArticlesPage() {
  const { articles, loading } = useApp();
  const [currentPage, setCurrentPage] = useState(1);

  // Sort: newest first
  const sortedArticles = useMemo(() => {
    return [...articles].reverse();
  }, [articles]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedArticles.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageArticles = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return sortedArticles.slice(start, start + PAGE_SIZE);
  }, [sortedArticles, safePage]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-navy-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <section className="section bg-color posts-expand slide-down-in">
      <div className="post-list-box post box-shadow-wrapper">
        <div className="article-wrapper bg-color">
          <section className="post-header">
            <h1 className="post-title text-lg">
              <i className="fa fa-file-text mr-2" />
              文章
            </h1>
            <div className="post-meta">全部文章 · 共 {sortedArticles.length} 篇</div>
          </section>

          <div className="post-body">
            {/* Empty state */}
            {sortedArticles.length === 0 && (
              <div className="text-center py-12">
                <i className="fa fa-pencil-square-o text-4xl text-ink-300 mb-4" />
                <p className="font-serif text-ink-500 text-lg">还没有文章</p>
              </div>
            )}

            {/* Article list */}
            {pageArticles.map((article) => (
              <ArticleCard key={article._id} article={article} />
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white box-shadow-wrapper pagination-wrapper">
                <ul className="pagination-ul">
                  {safePage > 1 && (
                    <li className="pagination-dir">
                      <a href="#" onClick={(e) => { e.preventDefault(); goToPage(safePage - 1); }}>
                        <i className="fa fa-angle-left" />
                      </a>
                    </li>
                  )}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <li key={page} className={`pagination-li ${page === safePage ? "pagination-active" : ""}`}>
                      <a href="#" onClick={(e) => { e.preventDefault(); goToPage(page); }}>{page}</a>
                    </li>
                  ))}
                  {safePage < totalPages && (
                    <li className="pagination-dir">
                      <a href="#" onClick={(e) => { e.preventDefault(); goToPage(safePage + 1); }}>
                        <i className="fa fa-angle-right" />
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
