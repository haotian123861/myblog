import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type Mode = "login" | "register";

export default function LoginPage() {
  const { isLoggedIn, login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result =
        mode === "login"
          ? await login(username, password)
          : await register(username, password, nickname || username);

      if (result.success) {
        navigate("/");
      } else {
        setError(result.error || "操作失败");
      }
    } catch {
      setError("操作失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError("");
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex">
      {/* Left panel - decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-navy-900 via-navy-800 to-gold-900 relative items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gold-500 flex items-center justify-center mx-auto mb-6 rounded-2xl shadow-lg shadow-gold-500/30">
            <span className="text-white font-display font-bold text-4xl">C</span>
          </div>
          <h1 className="font-display text-4xl font-bold text-ink-50 mb-3">
            Calm Halo T
          </h1>
          <p className="font-serif text-lg text-gold-200/80 max-w-sm mx-auto leading-relaxed">
            记录学习，分享收获，一起成长
          </p>
          <div className="mt-12 flex items-center justify-center gap-8">
            <div className="text-center">
              <p className="font-display text-2xl font-bold text-gold-400">3</p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-ink-500 mt-1">
                文章
              </p>
            </div>
            <div className="w-px h-10 bg-navy-700" />
            <div className="text-center">
              <p className="font-display text-2xl font-bold text-gold-400">85</p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-ink-500 mt-1">
                点赞
              </p>
            </div>
            <div className="w-px h-10 bg-navy-700" />
            <div className="text-center">
              <p className="font-display text-2xl font-bold text-gold-400">15</p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-ink-500 mt-1">
                评论
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 bg-gradient-to-br from-ink-50 via-ink-50 to-gold-50/50">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="font-display text-3xl font-bold text-navy-900">
              {mode === "login" ? "欢迎回来" : "加入这里"}
            </h2>
            <p className="font-serif text-ink-500 mt-2">
              {mode === "login"
                ? "登录以继续你的学习之旅"
                : "创建一个账号，开始记录学习"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-ink-500 mb-2">
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="输入用户名"
                required
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest text-ink-500 mb-2">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="输入密码"
                required
              />
            </div>

            {mode === "register" && (
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest text-ink-500 mb-2">
                  昵称
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="input-field"
                  placeholder="给自己取个名字（选填）"
                />
              </div>
            )}

            {error && (
              <p className="font-serif text-sm text-rust-500 flex items-center gap-2">
                <i className="fa-regular fa-circle-exclamation" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <i className="fa-solid fa-spinner fa-spin" />
                  处理中...
                </span>
              ) : mode === "login" ? (
                <>
                  <i className="fa-regular fa-lock" />
                  登录
                </>
              ) : (
                <>
                  <i className="fa-regular fa-user-plus" />
                  注册
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={switchMode}
              className="font-serif text-sm text-ink-500 hover:text-navy-900 transition-colors"
            >
              {mode === "login" ? (
                <>
                  还没有账号？
                  <span className="font-semibold text-navy-900 ml-1">去注册</span>
                </>
              ) : (
                <>
                  已有账号？
                  <span className="font-semibold text-navy-900 ml-1">去登录</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
