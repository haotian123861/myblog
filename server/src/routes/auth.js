import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getUserByUsername, getUserById, createUser } from "../db.js";
import { requireAuth, signToken, toSafeUser } from "../middleware/auth.js";

const router = Router();

router.post("/register", (req, res) => {
  const { username, password, nickname } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: "请填写用户名和密码" });
  }
  if (password.length < 4) {
    return res.status(400).json({ success: false, error: "密码至少4位" });
  }

  const existing = getUserByUsername(username);
  if (existing) {
    return res.status(409).json({ success: false, error: "用户名已存在" });
  }

  const salt = bcrypt.genSaltSync(10);
  const hashed = bcrypt.hashSync(password, salt);
  const now = new Date().toISOString();
  const uid = crypto.randomUUID();

  createUser({
    uid,
    username,
    password: hashed,
    nickname: (nickname || username).slice(0, 30) || "用户",
    role: "user",
    createdAt: now,
  });

  const user = getUserById(uid);
  const token = signToken(uid);

  res.json({ success: true, data: { token, user: toSafeUser(user) } });
});

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: "请填写用户名和密码" });
  }

  const user = getUserByUsername(username);
  if (!user) {
    return res.status(401).json({ success: false, error: "用户名或密码错误" });
  }

  const match = bcrypt.compareSync(password, user.password);
  if (!match) {
    return res.status(401).json({ success: false, error: "用户名或密码错误" });
  }

  const token = signToken(user._id);
  res.json({ success: true, data: { token, user: toSafeUser(user) } });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ success: true, data: { user: toSafeUser(req.user) } });
});

export default router;
