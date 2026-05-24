import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import api, { setToken } from "../utils/api";
import type { AppUser } from "../types";

interface AuthState {
  user: AppUser | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, password: string, nickname: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);
const USER_KEY = "blog_user";

/** Strip HTML/script tags and NoSQL injection operators from user input */
function sanitize(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/^\$/gm, "")
    .replace(/\.\./g, "")
    .trim();
}

/** Clean username to only allow characters supported by the system: letters, digits, . _ - */
function sanitizeUsername(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/^\$/gm, "")
    .replace(/\.\./g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .trim();
}

function toAppUser(data: any): AppUser {
  return {
    uid: data.uid || data._id || "",
    username: data.username || "",
    password: "",
    nickname: data.nickname || data.username || "",
    avatarUrl: data.avatarUrl || data.avatar_url,
    role: data.role || "user",
    createdAt: data.createdAt || data.created_at || "",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoggedIn: false,
    isAdmin: false,
    loading: true,
  });

  // Restore session from localStorage on mount
  useEffect(() => {
    async function restore() {
      const token = localStorage.getItem("blog_token");
      if (!token) {
        setState((s) => ({ ...s, loading: false }));
        return;
      }
      try {
        const { user } = await api.auth.me();
        const appUser = toAppUser(user);
        localStorage.setItem(USER_KEY, JSON.stringify(appUser));
        setState({
          user: appUser,
          isLoggedIn: true,
          isAdmin: appUser.role === "admin",
          loading: false,
        });
      } catch {
        // Token invalid or expired
        setToken(null);
        localStorage.removeItem(USER_KEY);
        setState((s) => ({ ...s, loading: false }));
      }
    }
    restore();
  }, []);

  const login = useCallback(
    async (
      username: string,
      password: string
    ): Promise<{ success: boolean; error?: string }> => {
      const safeUsername = sanitizeUsername(username);
      if (!safeUsername) return { success: false, error: "用户名只能包含字母、数字、.-_，请重新输入" };
      if (!password) return { success: false, error: "请输入密码" };

      try {
        const { token, user } = await api.auth.login({
          username: safeUsername,
          password,
        });

        const appUser = toAppUser(user);
        setToken(token);
        localStorage.setItem(USER_KEY, JSON.stringify(appUser));
        setState({
          user: appUser,
          isLoggedIn: true,
          isAdmin: appUser.role === "admin",
          loading: false,
        });
        return { success: true };
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "登录失败";
        return { success: false, error: msg };
      }
    },
    []
  );

  const register = useCallback(
    async (
      username: string,
      password: string,
      nickname: string
    ): Promise<{ success: boolean; error?: string }> => {
      const safeUsername = sanitizeUsername(username);
      const safeNickname = sanitize(nickname || username).slice(0, 30) || "用户";

      if (!safeUsername) {
        return { success: false, error: "用户名只能包含字母、数字、.-_，请重新输入" };
      }
      if (!password) {
        return { success: false, error: "请设置密码" };
      }
      if (password.length < 4) {
        return { success: false, error: "密码至少4位" };
      }

      try {
        const { token, user } = await api.auth.register({
          username: safeUsername,
          password,
          nickname: safeNickname,
        });

        const appUser = toAppUser(user);
        setToken(token);
        localStorage.setItem(USER_KEY, JSON.stringify(appUser));
        setState({
          user: appUser,
          isLoggedIn: true,
          isAdmin: appUser.role === "admin",
          loading: false,
        });
        return { success: true };
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "注册失败";
        return { success: false, error: msg };
      }
    },
    []
  );

  const logout = useCallback(() => {
    setToken(null);
    localStorage.removeItem(USER_KEY);
    setState({
      user: null,
      isLoggedIn: false,
      isAdmin: false,
      loading: false,
    });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
