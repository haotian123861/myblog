import { Link } from "react-router-dom";
import type { Article } from "../types";

interface Props {
  article: Article;
}

export default function ArticleCard({ article }: Props) {
  const date = new Date(article.createdAt).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const readingTime = Math.max(1, Math.ceil((article.content?.length || 0) / 500));

  return (
    <article className="post-list-box post box-shadow-wrapper slide-down-in">
      <div className="article-wrapper bg-color">
        <section className="post-header">
          <h1 className="post-title">
            <Link className="post-title-link" to={`/article/${article._id}`}>
              {article.title}
            </Link>
          </h1>
          <div className="post-meta">
            <span className="meta-item">
              <i className="fa fa-calendar-o" />
              &nbsp;发布于&nbsp;
              <span>{date}</span>
              <span className="post-meta-divider">|</span>
            </span>
            <span className="meta-item">
              <i className="fa fa-clock-o" />
              &nbsp;{readingTime} 分钟
              <span className="post-meta-divider">|</span>
            </span>
            <span className="meta-item">
              <i className="fa fa-heart" />
              &nbsp;{article.likesCount}
              <span className="post-meta-divider">|</span>
            </span>
            <span className="meta-item">
              <i className="fa fa-comment" />
              &nbsp;{article.commentsCount}
            </span>
          </div>
        </section>

        <div className="post-body">
          {article.tags.length > 0 && (
            <div className="mb-2">
              {article.tags.map((tag) => (
                <span key={tag} className="tag mr-1.5" style={{ fontSize: "0.6875rem" }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
          <p>{article.summary || article.content?.slice(0, 200) || ""}</p>
        </div>

        <div className="post-button text-center mt-4">
          <Link
            className="btn"
            to={`/article/${article._id}`}
            rel="contents"
          >
            阅读全文 &raquo;
          </Link>
        </div>
      </div>
    </article>
  );
}
