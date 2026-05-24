import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";

function formatTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ChatPage() {
  const { topics, createTopic, deleteTopic, getTopicComments, addTopicComment, deleteTopicComment, hasTopicLiked, toggleTopicLike } = useApp();
  const { isLoggedIn, user, isAdmin } = useAuth();

  // New topic form
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [creating, setCreating] = useState(false);

  // Expanded topic (show comments)
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  // Hot topics: top 5 by activity
  const hotTopics = useMemo(() => {
    return [...topics]
      .sort((a, b) => (b.likesCount + b.commentsCount * 2) - (a.likesCount + a.commentsCount * 2))
      .slice(0, 5);
  }, [topics]);

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || creating) return;
    setCreating(true);
    try {
      await createTopic(title.trim(), content.trim());
      setTitle("");
      setContent("");
      setShowForm(false);
    } catch {
      // silent
    } finally {
      setCreating(false);
    }
  };

  const handleToggleExpand = async (topicId: string) => {
    if (expandedId === topicId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(topicId);
    if (!comments[topicId]) {
      const list = await getTopicComments(topicId);
      setComments((prev) => ({ ...prev, [topicId]: list }));
    }
    if (isLoggedIn && likedMap[topicId] === undefined) {
      const liked = await hasTopicLiked(topicId);
      setLikedMap((prev) => ({ ...prev, [topicId]: liked }));
    }
  };

  const handleLike = async (topicId: string) => {
    if (!isLoggedIn) return;
    await toggleTopicLike(topicId);
    setLikedMap((prev) => ({ ...prev, [topicId]: !prev[topicId] }));
  };

  const handleAddComment = async (topicId: string) => {
    if (!commentText.trim() || sendingComment) return;
    setSendingComment(true);
    try {
      await addTopicComment(topicId, commentText.trim());
      setCommentText("");
      const list = await getTopicComments(topicId);
      setComments((prev) => ({ ...prev, [topicId]: list }));
    } catch {
      // silent
    } finally {
      setSendingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string, topicId: string) => {
    if (!window.confirm("确定删除此评论吗？")) return;
    await deleteTopicComment(commentId);
    const list = await getTopicComments(topicId);
    setComments((prev) => ({ ...prev, [topicId]: list }));
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!window.confirm("确定删除此话题吗？")) return;
    await deleteTopic(topicId);
    if (expandedId === topicId) setExpandedId(null);
  };

  return (
    <div className="slide-down-in space-y-8">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <h2 className="font-display text-lg font-bold text-navy-900 tracking-wide">话题</h2>
        <span className="w-px h-4 bg-ink-200" />
        <span className="font-serif text-sm text-ink-400">像微博一样自由创建和讨论话题</span>
      </div>

      {/* Hot topics bar */}
      {hotTopics.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h3 className="font-display text-sm font-bold text-navy-800 tracking-wide">热门话题</h3>
            <span className="w-px h-3 bg-ink-200" />
            <i className="fa fa-fire text-[11px] text-rust-500" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {hotTopics.map((t) => (
              <button
                key={t._id}
                onClick={() => handleToggleExpand(t._id)}
                className="px-3 py-1.5 bg-ink-50 border border-ink-200/60 rounded-lg text-xs text-ink-600 hover:bg-navy-900 hover:text-ink-50 hover:border-navy-900 transition-all duration-200 cursor-pointer font-medium"
              >
                # {t.title}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Create topic button / form */}
      {isLoggedIn && (
        <div>
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-3 px-4 bg-ink-50 border-2 border-dashed border-ink-200/60 rounded-xl text-ink-500 hover:bg-ink-100 hover:border-navy-400 hover:text-navy-700 transition-all duration-200 cursor-pointer font-serif text-sm flex items-center justify-center gap-2"
            >
              <i className="fa fa-plus text-xs" />
              创建新话题
            </button>
          ) : (
            <form onSubmit={handleCreateTopic} className="p-4 sm:p-5 bg-ink-50 border border-ink-200/60 rounded-xl">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="话题标题"
                maxLength={60}
                className="w-full mb-3 px-3 py-2.5 border border-ink-200 rounded-lg text-sm font-semibold text-ink-800 outline-none focus:border-navy-400 box-border bg-white"
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`以 ${user?.nickname || "用户"} 的身份说点什么吧...`}
                rows={3}
                className="w-full mb-3 px-3 py-2.5 border border-ink-200 rounded-lg text-sm font-serif text-ink-700 resize-vertical outline-none focus:border-navy-400 box-border bg-white"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setTitle(""); setContent(""); }}
                  className="px-4 py-1.5 rounded-lg text-sm font-serif text-ink-500 hover:bg-ink-200 transition-all duration-200 cursor-pointer border-none"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || !content.trim() || creating}
                  className={`px-5 py-1.5 rounded-lg text-sm font-serif transition-all duration-200 border-none ${
                    title.trim() && content.trim() && !creating
                      ? "bg-navy-900 text-ink-50 hover:bg-navy-800 cursor-pointer"
                      : "bg-ink-200 text-ink-400 cursor-not-allowed"
                  }`}
                >
                  {creating ? "发布中..." : "发布"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Auth gate */}
      {!isLoggedIn && (
        <div className="text-center py-10 px-4 bg-ink-50 border border-ink-200/60 rounded-xl">
          <i className="fa fa-lock text-3xl text-ink-300 mb-3" />
          <p className="font-serif text-ink-500 text-sm mb-4">登录后即可创建和参与话题</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-navy-900 text-ink-50 rounded-lg text-sm font-serif hover:bg-navy-800 transition-colors"
          >
            <i className="fa fa-sign-in" /> 去登录
          </Link>
        </div>
      )}

      {/* Topic list */}
      {topics.length === 0 ? (
        <div className="bg-ink-50 border border-ink-200/60 rounded-xl p-14 text-center">
          <i className="fa fa-comments text-5xl text-ink-300 mb-4" />
          <p className="font-serif text-ink-500 text-lg">还没有话题</p>
          <p className="font-serif text-ink-400 text-sm mt-2">来创建第一个吧</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {topics.map((topic) => {
            const isExpanded = expandedId === topic._id;
            const topicComments = comments[topic._id] || [];
            const isLiked = likedMap[topic._id] || false;

            return (
              <div key={topic._id} className="bg-ink-50 border border-ink-200/60 rounded-xl overflow-hidden hover:shadow-sm hover:border-navy-300 transition-all duration-300">
                {/* Topic body */}
                <div className="p-3 sm:p-4 pb-2 sm:pb-3 cursor-pointer" onClick={() => handleToggleExpand(topic._id)}>
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-navy-900 text-ink-100 flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0">
                      {topic.authorName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-semibold text-sm text-navy-900">{topic.authorName}</span>
                        <span className="text-[10px] sm:text-[11px] text-ink-400">{formatTime(topic.createdAt)}</span>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-ink-800 mb-1">{topic.title}</h3>
                      <p className="text-xs sm:text-sm text-ink-600 leading-relaxed whitespace-pre-wrap break-words">{topic.content}</p>
                    </div>
                  </div>
                </div>

                {/* Action bar */}
                <div className="px-3 sm:px-4 pb-2 sm:pb-3 flex items-center gap-3 sm:gap-4 text-xs text-ink-400 border-b border-ink-200/40">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleExpand(topic._id); }}
                    className={`flex items-center gap-1 transition-colors cursor-pointer bg-transparent border-none ${
                      isExpanded ? "text-navy-700" : "text-ink-400 hover:text-navy-700"
                    }`}
                  >
                    <i className="fa fa-comment-o text-[11px]" />
                    <span>{topic.commentsCount}</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleLike(topic._id); }}
                    disabled={!isLoggedIn}
                    className={`flex items-center gap-1 transition-colors cursor-pointer bg-transparent border-none ${
                      isLiked ? "text-rust-500" : "text-ink-400 hover:text-rust-500"
                    } ${!isLoggedIn ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <i className={`fa ${isLiked ? "fa-heart" : "fa-heart-o"} text-[11px]`} />
                    <span>{topic.likesCount}</span>
                  </button>
                  {(isAdmin || topic.authorId === user?.uid) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteTopic(topic._id); }}
                      className="flex items-center gap-1 text-ink-400 hover:text-rust-500 transition-colors cursor-pointer bg-transparent border-none ml-auto"
                    >
                      <i className="fa fa-trash" />
                    </button>
                  )}
                </div>

                {/* Expanded comments */}
                {isExpanded && (
                  <div className="px-3 sm:px-4 py-3 bg-white/40">
                    {isLoggedIn && (
                      <div className="flex gap-2 mb-3">
                        <textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="说两句..."
                          rows={2}
                          className="flex-1 px-3 py-2 border border-ink-200 rounded-lg text-sm font-serif text-ink-700 resize-none outline-none focus:border-navy-400 text-[13px] bg-white"
                        />
                        <button
                          onClick={() => handleAddComment(topic._id)}
                          disabled={!commentText.trim() || sendingComment}
                          className={`self-end px-3 sm:px-4 py-2 rounded-lg text-sm font-serif transition-all border-none ${
                            commentText.trim() && !sendingComment
                              ? "bg-navy-900 text-ink-50 hover:bg-navy-800 cursor-pointer"
                              : "bg-ink-200 text-ink-400 cursor-not-allowed"
                          }`}
                        >
                          {sendingComment ? "..." : "评论"}
                        </button>
                      </div>
                    )}
                    {topicComments.length === 0 ? (
                      <p className="text-center text-ink-400 text-xs py-3 font-serif">暂无评论</p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {topicComments.map((c: any) => (
                          <div key={c._id} className="flex gap-2 text-sm">
                            <span className="font-semibold text-navy-800 whitespace-nowrap text-[13px]">{c.authorName}:</span>
                            <span className="text-ink-600 text-[13px] break-words flex-1">{c.content}</span>
                            {(isAdmin || c.authorId === user?.uid) && (
                              <button
                                onClick={() => handleDeleteComment(c._id, topic._id)}
                                className="text-ink-300 hover:text-rust-500 text-[11px] bg-transparent border-none cursor-pointer flex-shrink-0"
                              >
                                <i className="fa fa-times" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
