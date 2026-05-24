import { Link, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";

const MODULES = [
  { path: "/articles", label: "文章", icon: "fa-file-text" },
  { path: "/chat", label: "话题", icon: "fa-comments" },
  { path: "/files", label: "文件", icon: "fa-folder-open" },


];

export default function Sidebar() {
  const { articles } = useApp();
  const { isAdmin } = useAuth();
  const location = useLocation();
  const articleCount = articles.length;

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="sidebar-wrapper box-shadow-wrapper" id="sidebarMeta">
      {/* Motto / Quote */}
      <div className="sidebar-motto">
        <p className="motto-text">学而不思则罔，</p>
        <p className="motto-text">思而不学则殆。</p>
      </div>

      {/* Home button */}
      <div className="sidebar-home-btn">
        <Link to="/" className="home-btn-link">
          <i className="fa fa-home" /> 首页
        </Link>
      </div>

      {/* Module navigation */}
      <div className="sidebar-modules">
        {MODULES.map((mod) => (
          <Link
            key={mod.path}
            to={mod.path}
            className={`sidebar-module-item ${isActive(mod.path) ? "module-active" : ""}`}
          >
            <i className={`fa ${mod.icon}`} />
            <span>{mod.label}</span>
          </Link>
        ))}
        {isAdmin && (
          <Link
            to="/admin"
            className={`sidebar-module-item ${isActive("/admin") ? "module-active" : ""}`}
          >
            <i className="fa fa-cog" />
            <span>管理</span>
          </Link>
        )}
      </div>

      {/* Author avatar */}
      <div className="sidebar-item" style={{ padding: "16px 20px 0", textAlign: "center" }}>
        <img
          className="site-author-image right-motion"
          src="/avatar.png"
          alt="avatar"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <p className="site-author-name">Calm Halo T</p>
      </div>

      {/* Stats */}
      <div className="sidebar-item side-item-stat right-motion">
        <div className="sidebar-item-box">
          <Link to="/articles">
            <span className="site-item-stat-count">{articleCount}</span>
            <span className="site-item-stat-name">文章</span>
          </Link>
        </div>
        <div className="sidebar-item-box">
          <span className="site-item-stat-count">0</span>
          <span className="site-item-stat-name">分类</span>
        </div>
        <div className="sidebar-item-box">
          <span className="site-item-stat-count">0</span>
          <span className="site-item-stat-name">标签</span>
        </div>
      </div>

      <style>{`
        .sidebar-motto {
          padding: 20px 20px 12px;
          text-align: center;
          border-bottom: 1px solid #f0f0f0;
        }
        .motto-text {
          font-family: "Noto Serif SC", Georgia, serif;
          font-size: 0.875rem;
          color: #704828;
          line-height: 1.6;
          margin: 0;
          letter-spacing: 0.04em;
        }
        .sidebar-home-btn {
          padding: 12px 20px;
          border-bottom: 1px solid #f0f0f0;
        }
        .home-btn-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 0;
          background: #402818;
          color: #f5ede0;
          font-size: 0.875rem;
          font-family: "Noto Serif SC", Georgia, serif;
          border-radius: 3px;
          text-decoration: none;
          transition: background .2s;
        }
        .home-btn-link:hover {
          background: #583820;
        }
        .sidebar-modules {
          padding: 8px 0;
          border-bottom: 1px solid #f0f0f0;
        }
        .sidebar-module-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          color: #605048;
          font-size: 0.875rem;
          font-family: "Source Serif 4", Georgia, serif;
          text-decoration: none;
          transition: all .2s;
          border-left: 3px solid transparent;
        }
        .sidebar-module-item:hover {
          color: #402818;
          background: #fdf4ee;
        }
        .sidebar-module-item.module-active {
          color: #402818;
          background: #f5e6d8;
          border-left-color: #402818;
          font-weight: 600;
        }
        .sidebar-module-item i {
          width: 18px;
          text-align: center;
          font-size: 0.9375rem;
        }
      `}</style>
    </div>
  );
}
