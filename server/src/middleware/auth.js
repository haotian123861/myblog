import jwt from "jsonwebtoken";
import { getUserById } from "../db.js";

const JWT_SECRET = process.env.JWT_SECRET || "default-dev-secret";

/** Require a valid JWT. Sets req.user on success. */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "未登录" });
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    const user = getUserById(payload.uid);
    if (!user) {
      return res.status(401).json({ success: false, error: "用户不存在" });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, error: "token无效或已过期" });
  }
}

/** Require admin role. Must be used after requireAuth. */
export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, error: "需要管理员权限" });
  }
  next();
}

/** Optional auth: sets req.user if token present, but doesn't block. */
export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    try {
      const payload = jwt.verify(header.slice(7), JWT_SECRET);
      req.user = getUserById(payload.uid);
    } catch {
      // ignore invalid token
    }
  }
  next();
}

export function signToken(uid) {
  return jwt.sign({ uid }, JWT_SECRET, { expiresIn: "7d" });
}

/** Map a DB user row to the AppUser shape the frontend expects. */
export function toSafeUser(row) {
  if (!row) return null;
  const { password, avatar_url, ...rest } = row;
  return {
    uid: rest._id,
    username: rest.username,
    password: "",
    nickname: rest.nickname,
    avatarUrl: avatar_url,
    role: rest.role,
    createdAt: rest.created_at,
  };
}
