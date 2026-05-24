import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { Link } from "react-router-dom";

export default function ProfilePage() {
  const { user, isAdmin } = useAuth();
  const { articles } = useApp();

  if (!user) return null;

  const userArticles = articles.filter(
    (a) => a.authorId === user.uid
  );
  const totalLikes = userArticles.reduce(
    (sum, a) => sum + a.likesCount,
    0
  );
  const totalComments = userArticles.reduce(
    (sum, a) => sum + a.commentsCount,
    0
  );

  const joinedDate = new Date(user.createdAt).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-ink-50">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
        {/* Profile header */}
        <div className="card p-8 md:p-10">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 bg-navy-900 flex items-center justify-center flex-shrink-0">
              <span className="text-gold-400 font-display font-bold text-3xl">
                {user.nickname.charAt(0)}
              </span>
            </div>

            <div className="text-center md:text-left flex-1">
              <h1 className="font-display text-2xl font-bold text-navy-900">
                {user.nickname}
              </h1>
              <p className="font-mono text-xs text-ink-400 mt-1">
                @{user.username}
              </p>
              <div className="flex items-center justify-center md:justify-start gap-3 mt-2">
                <span
                  className={`tag text-[10px] ${
                    isAdmin
                      ? "bg-gold-50 text-gold-700"
                      : "bg-ink-100 text-ink-500"
                  }`}
                >
                  {isAdmin ? "管理员" : "普通用户"}
                </span>
                <span className="font-mono text-[10px] text-ink-400">
                  <i className="fa-regular fa-calendar mr-1" />
                  加入于 {joinedDate}
                </span>
              </div>
            </div>

            {isAdmin && (
              <Link to="/admin" className="btn-secondary text-xs py-2 px-4 flex-shrink-0">
                <i className="fa-regular fa-gear" />
                管理后台
              </Link>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="card p-5 text-center">
            <p className="font-display text-2xl font-bold text-navy-900">
              {userArticles.length}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-ink-400 mt-1">
              文章
            </p>
          </div>
          <div className="card p-5 text-center">
            <p className="font-display text-2xl font-bold text-rust-500">
              {totalLikes}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-ink-400 mt-1">
              获赞
            </p>
          </div>
          <div className="card p-5 text-center">
            <p className="font-display text-2xl font-bold text-navy-900">
              {totalComments}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-ink-400 mt-1">
              评论
            </p>
          </div>
        </div>

        {/* User's articles */}
        <div className="mt-10">
          <h2 className="font-display text-xl font-bold text-navy-900 mb-6">
            <i className="fa-regular fa-file-lines mr-2 text-gold-500" />
            我的文章
          </h2>

          {userArticles.length === 0 ? (
            <div className="card p-8 text-center">
              <i className="fa-regular fa-pen-to-square text-2xl text-ink-200 mb-3" />
              <p className="font-serif text-ink-400">
                还没有写过文章
              </p>
              {isAdmin && (
                <Link to="/write" className="btn-primary mt-4 inline-flex text-xs">
                  <i className="fa-regular fa-plus" />
                  写第一篇
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {userArticles.map((article) => (
                <Link
                  key={article._id}
                  to={`/article/${article._id}`}
                  className="card p-4 flex items-center justify-between gap-4 hover:border-navy-300 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-base font-semibold text-navy-900 group-hover:text-navy-700 transition-colors">
                      {article.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="font-mono text-[10px] text-ink-400">
                        {new Date(article.createdAt).toLocaleDateString("zh-CN")}
                      </span>
                      <span className="text-[10px] text-ink-300">
                        <i className="fa-regular fa-heart mr-1" />
                        {article.likesCount}
                      </span>
                      <span className="text-[10px] text-ink-300">
                        <i className="fa-regular fa-comment mr-1" />
                        {article.commentsCount}
                      </span>
                    </div>
                  </div>
                  <i className="fa-regular fa-chevron-right text-ink-300 group-hover:text-navy-900 transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
