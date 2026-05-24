import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const MODULES = [
  { path: "/", label: "首页", icon: "fa-home" },
  { path: "/articles", label: "文章", icon: "fa-file-text" },
  { path: "/chat", label: "话题", icon: "fa-comments" },
  { path: "/files", label: "文件", icon: "fa-folder-open" },
];

export default function Navbar() {
  const { user, isLoggedIn, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="pisces">
      <div className="head-top-line" />

      <header className="header">
        <div className="blog-header box-shadow-wrapper" id="header">
          {/* Mobile nav toggle */}
          <div
            className={`nav-toggle ${menuOpen ? "nav-toggle-active" : ""}`}
            id="nav_toggle"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <div className="toggle-box">
              <div className="line line-top"></div>
              <div className="line line-center"></div>
              <div className="line line-bottom"></div>
            </div>
          </div>

          {/* Login / Register - top right */}
          <div className="header-auth">
            {isLoggedIn ? (
              <div className="header-user">
                <Link to="/profile" className="header-user-name">
                  <i className="fa fa-user-circle" /> {user?.nickname}
                </Link>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); logout(); }}
                  className="header-logout"
                  title="退出登录"
                >
                  <i className="fa fa-sign-out" />
                </a>
              </div>
            ) : (
              <Link to="/login" className="header-login-btn">
                <i className="fa fa-lock" /> 登录
              </Link>
            )}
          </div>

          {/* Site title */}
          <div className="site-meta">
            <div className="site-title">
              <Link to="/" className="brand">
                <span>Calm Halo T</span>
              </Link>
            </div>
            <p className="subtitle">记录学习，分享收获</p>
          </div>

          {/* Mobile dropdown menu */}
          {menuOpen && (
            <div className="mobile-menu" onClick={() => setMenuOpen(false)}>
              {MODULES.map((mod) => (
                <Link
                  key={mod.label}
                  to={mod.path}
                  className={`mobile-menu-item ${isActive(mod.path) ? "mobile-menu-active" : ""}`}
                >
                  <i className={`fa ${mod.icon}`} />
                  <span>{mod.label}</span>
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`mobile-menu-item ${isActive("/admin") ? "mobile-menu-active" : ""}`}
                >
                  <i className="fa fa-cog" />
                  <span>管理</span>
                </Link>
              )}
            </div>
          )}

          <style>{`
            .header { margin: 0 auto 0; padding: 0; }
            .blog-header {
              background: linear-gradient(135deg, #402818 0%, #583820 100%);
              border-radius: 0 0 6px 6px;
              padding: 16px 24px 0;
              position: relative;
            }
            .header-auth {
              position: absolute;
              top: 14px;
              right: 24px;
              z-index: 20;
            }
            .header-login-btn {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              padding: 5px 16px;
              background: rgba(255,255,255,.12);
              color: #f5ede0;
              font-size: 0.8125rem;
              font-family: "Source Serif 4", Georgia, serif;
              border-radius: 6px;
              text-decoration: none;
              transition: background .25s;
            }
            .header-login-btn:hover {
              background: rgba(255,255,255,.2);
            }
            .header-user {
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .header-user-name {
              color: rgba(245,237,224,.85);
              font-size: 0.8125rem;
              font-family: "Source Serif 4", Georgia, serif;
              text-decoration: none;
              transition: color .25s;
            }
            .header-user-name:hover { color: #f5ede0; }
            .header-logout {
              color: rgba(245,237,224,.5);
              font-size: 0.875rem;
              text-decoration: none;
              transition: color .25s;
            }
            .header-logout:hover { color: #f5ede0; }
            .nav-toggle {
              display: none;
              position: absolute;
              top: 12px;
              left: 20px;
              cursor: pointer;
              padding: 4px;
              z-index: 10;
            }
            .toggle-box { width: 20px; height: 16px; position: relative; }
            .toggle-box .line {
              width: 100%; height: 2px;
              background: rgba(255,255,255,.7);
              position: absolute;
              transition: all .25s;
            }
            .line-top { top: 0; }
            .line-center { top: 7px; }
            .line-bottom { top: 14px; }
            .nav-toggle-active .line-top {
              transform: rotate(45deg);
              top: 7px;
            }
            .nav-toggle-active .line-center { opacity: 0; }
            .nav-toggle-active .line-bottom {
              transform: rotate(-45deg);
              top: 7px;
            }
            .site-meta { text-align: center; padding-bottom: 12px; }
            .site-title { margin-bottom: 2px; }
            .site-title .brand {
              color: #f5ede0;
              font-family: "Noto Serif SC", Georgia, serif;
              font-size: 1.25rem;
              font-weight: 700;
              letter-spacing: 0.04em;
              text-decoration: none;
              transition: color .25s;
            }
            .site-title .brand:hover { color: #d4a888; }
            .subtitle {
              color: rgba(245,237,224,.7);
              font-size: 0.75rem;
              font-family: "Source Serif 4", Georgia, serif;
              margin: 0;
              letter-spacing: 0.06em;
            }

            .mobile-menu {
              background: #fff;
              border-radius: 0 0 6px 6px;
              box-shadow: 0 4px 20px rgba(64, 40, 24, 0.15);
              padding: 8px 0;
              margin: 12px -24px 0;
            }
            .mobile-menu-item {
              display: flex;
              align-items: center;
              gap: 10px;
              padding: 12px 24px;
              color: #605048;
              font-size: 0.9375rem;
              font-family: "Source Serif 4", Georgia, serif;
              text-decoration: none;
              transition: all .2s;
              border-left: 3px solid transparent;
            }
            .mobile-menu-item:hover {
              background: #fdf4ee;
              color: #402818;
            }
            .mobile-menu-item.mobile-menu-active {
              color: #402818;
              background: #f5e6d8;
              border-left-color: #402818;
              font-weight: 600;
            }
            .mobile-menu-item i {
              width: 20px;
              text-align: center;
              font-size: 1rem;
            }

            @media (max-width: 768px) {
              .blog-header { padding: 12px 16px 0; }
              .nav-toggle { display: block; }
              .header-auth {
                top: 10px;
                right: 16px;
              }
              .header-login-btn {
                padding: 3px 10px;
                font-size: 0.75rem;
              }
              .mobile-menu {
                margin: 12px -16px 0;
              }
            }
          `}</style>
        </div>
      </header>
    </div>
  );
}
