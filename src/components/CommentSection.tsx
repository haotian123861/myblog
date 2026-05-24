import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import type { Comment } from "../types";

interface Props {
  articleId: string;
}

export default function CommentSection({ articleId }: Props) {
  const { user, isLoggedIn, isAdmin } = useAuth();
  const { getComments, addComment, deleteComment } = useApp();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    (async () => {
      setComments(await getComments(articleId));
    })();
  }, [articleId, getComments]);

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    await addComment(articleId, trimmed);
    setText("");
    setComments(await getComments(articleId));
  };

  const handleDelete = async (commentId: string) => {
    await deleteComment(commentId, articleId);
    setComments(await getComments(articleId));
  };

  return (
    <div className="mt-12 pt-8 border-t border-ink-100">
      <h3 className="font-display text-xl font-bold text-navy-900 mb-6">
        <i className="fa-regular fa-comments mr-2 text-gold-500" />
        评论 ({comments.length})
      </h3>

      {/* Comment form */}
      {isLoggedIn ? (
        <div className="mb-8">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`写下你的想法，${user?.nickname}...`}
            rows={3}
            className="input-field resize-none font-serif"
          />
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!text.trim()}
              className="btn-primary text-xs py-2 px-5 disabled:opacity-30"
            >
              <i className="fa-regular fa-paper-plane" />
              发表评论
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-8 p-6 bg-ink-50 border border-ink-100 text-center">
          <p className="font-serif text-ink-500 text-sm">
            <i className="fa-regular fa-lock mr-2" />
            登录后即可发表评论
          </p>
        </div>
      )}

      {/* Comments list */}
      {comments.length === 0 ? (
        <p className="font-serif text-ink-400 text-sm text-center py-8">
          暂无评论，来坐坐沙发吧
        </p>
      ) : (
        <div className="space-y-5">
          {comments.map((comment) => (
            <div
              key={comment._id}
              className="flex gap-4 group"
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-navy-800 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="font-display text-sm font-bold text-gold-400">
                  {comment.authorName.charAt(0)}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-display text-sm font-semibold text-navy-900">
                    {comment.authorName}
                  </span>
                  <span className="font-mono text-[10px] text-ink-400">
                    {new Date(comment.createdAt).toLocaleDateString("zh-CN", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <p className="font-serif text-sm text-ink-700 leading-relaxed">
                  {comment.content}
                </p>
                {/* Delete (admin or own) */}
                {(isAdmin || user?.uid === comment.authorId) && (
                  <button
                    onClick={() => handleDelete(comment._id)}
                    className="mt-1 text-[10px] text-ink-300 hover:text-rust-500 transition-colors font-mono uppercase tracking-wider opacity-30 md:opacity-0 md:group-hover:opacity-100"
                  >
                    <i className="fa-regular fa-trash-can mr-1" />
                    删除
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
