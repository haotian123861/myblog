import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import db from "../utils/db";
import type { AppUser } from "../types";

export default function AdminPage() {
  const { user } = useAuth();
  const { articles, refreshArticles } = useApp();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [activeTab, setActiveTab] = useState<"articles" | "users">("articles");

  useEffect(() => {
    (async () => {
      setUsers(await db.getAllUsers());
    })();
  }, []);

  const handleRoleChange = async (uid: string, role: "admin" | "user") => {
    if (uid === user?.uid) return;
    await db.setUserRole(uid, role);
    setUsers(await db.getAllUsers());
  };

  const handleDeleteArticle = async (articleId: string, title: string) => {
    if (window.confirm(`确定删除「${title}」吗？`)) {
      await db.deleteArticle(articleId);
      refreshArticles();
    }
  };

  const handleDeleteUser = async (uid: string, username: string) => {
    if (uid === user?.uid) {
      alert("不能删除自己");
      return;
    }
    if (window.confirm(`确定删除用户「${username}」吗？（该操作不可恢复）`)) {
      await db.deleteUserData(uid);
      setUsers(await db.getAllUsers());
    }
  };

  const tabs = [
    { key: "articles" as const, label: "文章管理", icon: "fa-regular fa-file-lines" },
    { key: "users" as const, label: "用户管理", icon: "fa-regular fa-users" },
  ];

  return (
    <div className="min-h-screen bg-ink-50">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-navy-900">
            管理后台
          </h1>
          <p className="font-serif text-ink-500 mt-2">
            你好，{user?.nickname} &mdash; 管理文章和用户
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-ink-100 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap px-4 sm:px-5 py-3 text-sm font-display uppercase tracking-wider transition-colors ${
                activeTab === tab.key
                  ? "text-navy-900 border-b-2 border-navy-900"
                  : "text-ink-400 hover:text-ink-600"
              }`}
            >
              <i className={`${tab.icon} mr-2`} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Articles tab */}
        {activeTab === "articles" && (
          <div className="space-y-3">
            {articles.length === 0 ? (
              <div className="text-center py-12 text-ink-400 font-serif">
                还没有文章
              </div>
            ) : (
              articles.map((article) => (
                <div
                  key={article._id}
                  className="card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/article/${article._id}`}
                      className="font-display text-base font-semibold text-navy-900 hover:text-navy-700 transition-colors"
                    >
                      {article.title}
                    </Link>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="font-mono text-[10px] text-ink-400 uppercase">
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
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      to={`/write/${article._id}`}
                      className="btn-ghost text-xs"
                    >
                      <i className="fa-regular fa-pen-to-square" />
                      编辑
                    </Link>
                    <button
                      onClick={() =>
                        handleDeleteArticle(article._id, article.title)
                      }
                      className="btn-ghost text-xs text-rust-500"
                    >
                      <i className="fa-regular fa-trash-can" />
                      删除
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Users tab */}
        {activeTab === "users" && (
          <div className="card overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-ink-100 border-b border-ink-200">
                <tr>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-ink-500">
                    用户
                  </th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-ink-500">
                    用户名
                  </th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-ink-500">
                    角色
                  </th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-ink-500">
                    注册时间
                  </th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-ink-500">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {users.map((u) => (
                  <tr key={u.uid} className="hover:bg-ink-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-navy-800 flex items-center justify-center">
                          <span className="text-gold-400 font-display font-bold text-xs">
                            {u.nickname.charAt(0)}
                          </span>
                        </div>
                        <span className="font-display text-sm font-semibold text-navy-900">
                          {u.nickname}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-500">
                      {u.username}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`tag text-[10px] ${
                          u.role === "admin"
                            ? "bg-gold-50 text-gold-700"
                            : "bg-ink-100 text-ink-600"
                        }`}
                      >
                        {u.role === "admin" ? "管理员" : "用户"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-ink-400">
                      {new Date(u.createdAt).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {u.uid !== user?.uid && (
                          <>
                            <select
                              value={u.role}
                              onChange={(e) =>
                                handleRoleChange(u.uid, e.target.value as "admin" | "user")
                              }
                              className="font-mono text-[10px] border border-ink-200 bg-white px-2 py-1 text-ink-600 focus:outline-none focus:border-navy-300"
                            >
                              <option value="user">用户</option>
                              <option value="admin">管理员</option>
                            </select>
                            <button
                              onClick={() => handleDeleteUser(u.uid, u.username)}
                              className="text-ink-300 hover:text-rust-500 transition-colors"
                              title="删除用户"
                            >
                              <i className="fa-regular fa-trash-can text-xs" />
                            </button>
                          </>
                        )}
                        {u.uid === user?.uid && (
                          <span className="font-mono text-[10px] text-ink-300">
                            当前账号
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
