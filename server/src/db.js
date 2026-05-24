import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "..", "data.db");

const db = new Database(dbPath);

// Enable WAL mode for better concurrent performance
db.pragma("journal_mode = WAL");

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      _id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT NOT NULL,
      avatar_url TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS articles (
      _id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      summary TEXT DEFAULT '',
      cover_image TEXT,
      tags TEXT DEFAULT '[]',
      author_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      likes_count INTEGER DEFAULT 0,
      comments_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS comments (
      _id TEXT PRIMARY KEY,
      article_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      avatar_url TEXT,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS likes (
      article_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (article_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      _id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      author_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS file_categories (
      _id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS files (
      _id TEXT PRIMARY KEY,
      original_name TEXT NOT NULL,
      stored_path TEXT NOT NULL,
      size INTEGER NOT NULL,
      category_id TEXT,
      uploader_id TEXT NOT NULL,
      uploader_name TEXT NOT NULL,
      download_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS topics (
      _id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      likes_count INTEGER DEFAULT 0,
      comments_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS topic_comments (
      _id TEXT PRIMARY KEY,
      topic_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS topic_likes (
      topic_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (topic_id, user_id)
    );
  `);
}

function genId() {
  return crypto.randomUUID();
}

// ─── Users ────────────────────────────────────────────────
export function getUserByUsername(username) {
  return db.prepare("SELECT * FROM users WHERE username = ?").get(username);
}

export function getUserById(uid) {
  return db.prepare("SELECT * FROM users WHERE _id = ?").get(uid);
}

export function createUser({ uid, username, password, nickname, role, createdAt }) {
  db.prepare(
    "INSERT INTO users (_id, username, password, nickname, role, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(uid, username, password, nickname, role, createdAt);
}

export function getAllUsers() {
  return db.prepare("SELECT * FROM users ORDER BY created_at DESC").all();
}

export function setUserRole(uid, role) {
  db.prepare("UPDATE users SET role = ? WHERE _id = ?").run(role, uid);
}

export function deleteUser(uid) {
  db.prepare("DELETE FROM users WHERE _id = ?").run(uid);
}

// ─── Articles ─────────────────────────────────────────────
export function getArticles() {
  return db.prepare("SELECT * FROM articles ORDER BY created_at DESC").all();
}

export function getArticleById(id) {
  return db.prepare("SELECT * FROM articles WHERE _id = ?").get(id);
}

export function createArticle({ _id, title, content, summary, coverImage, tags, authorId, authorName, createdAt, updatedAt }) {
  db.prepare(
    "INSERT INTO articles (_id, title, content, summary, cover_image, tags, author_id, author_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(_id, title, content, summary || "", coverImage || null, JSON.stringify(tags || []), authorId, authorName, createdAt, updatedAt);
}

export function updateArticle(id, fields) {
  const setClauses = [];
  const values = [];
  if (fields.title !== undefined) { setClauses.push("title = ?"); values.push(fields.title); }
  if (fields.content !== undefined) { setClauses.push("content = ?"); values.push(fields.content); }
  if (fields.summary !== undefined) { setClauses.push("summary = ?"); values.push(fields.summary); }
  if (fields.coverImage !== undefined) { setClauses.push("cover_image = ?"); values.push(fields.coverImage); }
  if (fields.tags !== undefined) { setClauses.push("tags = ?"); values.push(JSON.stringify(fields.tags)); }
  if (fields.updatedAt !== undefined) { setClauses.push("updated_at = ?"); values.push(fields.updatedAt); }
  if (setClauses.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE articles SET ${setClauses.join(", ")} WHERE _id = ?`).run(...values);
}

export function deleteArticle(id) {
  const del = db.transaction(() => {
    db.prepare("DELETE FROM articles WHERE _id = ?").run(id);
    db.prepare("DELETE FROM comments WHERE article_id = ?").run(id);
    db.prepare("DELETE FROM likes WHERE article_id = ?").run(id);
  });
  del();
}

export function incArticleCommentsCount(id, delta) {
  db.prepare("UPDATE articles SET comments_count = comments_count + ? WHERE _id = ?").run(delta, id);
}

export function incArticleLikesCount(id, delta) {
  db.prepare("UPDATE articles SET likes_count = likes_count + ? WHERE _id = ?").run(delta, id);
}

// ─── Comments ─────────────────────────────────────────────
export function getCommentsByArticle(articleId) {
  return db.prepare("SELECT * FROM comments WHERE article_id = ? ORDER BY created_at ASC").all(articleId);
}

export function createComment({ _id, articleId, authorId, authorName, avatarUrl, content, createdAt }) {
  db.prepare(
    "INSERT INTO comments (_id, article_id, author_id, author_name, avatar_url, content, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(_id, articleId, authorId, authorName, avatarUrl || null, content, createdAt);
}

export function getCommentById(id) {
  return db.prepare("SELECT * FROM comments WHERE _id = ?").get(id);
}

export function deleteComment(id) {
  db.prepare("DELETE FROM comments WHERE _id = ?").run(id);
}

// ─── Likes ────────────────────────────────────────────────
export function hasLiked(articleId, userId) {
  return db.prepare("SELECT 1 FROM likes WHERE article_id = ? AND user_id = ?").get(articleId, userId);
}

export function addLike(articleId, userId, createdAt) {
  db.prepare("INSERT OR IGNORE INTO likes (article_id, user_id, created_at) VALUES (?, ?, ?)").run(articleId, userId, createdAt);
}

export function removeLike(articleId, userId) {
  db.prepare("DELETE FROM likes WHERE article_id = ? AND user_id = ?").run(articleId, userId);
}

// ─── Messages ─────────────────────────────────────────────
export function getMessages() {
  return db.prepare("SELECT * FROM messages ORDER BY created_at DESC").all();
}

export function createMessage({ _id, content, authorId, authorName, createdAt }) {
  db.prepare(
    "INSERT INTO messages (_id, content, author_id, author_name, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(_id, content, authorId, authorName, createdAt);
}

// ─── File Categories ──────────────────────────────────────
export function getFileCategories() {
  return db.prepare("SELECT * FROM file_categories ORDER BY created_at ASC").all();
}

export function createFileCategory({ _id, name, createdAt }) {
  db.prepare("INSERT INTO file_categories (_id, name, created_at) VALUES (?, ?, ?)").run(_id, name, createdAt);
}

export function deleteFileCategory(id) {
  db.prepare("DELETE FROM file_categories WHERE _id = ?").run(id);
}

// ─── Files ────────────────────────────────────────────────
export function getFiles() {
  return db.prepare("SELECT * FROM files ORDER BY created_at DESC").all();
}

export function createFileRecord({ _id, originalName, storedPath, size, categoryId, uploaderId, uploaderName, createdAt }) {
  db.prepare(
    "INSERT INTO files (_id, original_name, stored_path, size, category_id, uploader_id, uploader_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(_id, originalName, storedPath, size, categoryId || null, uploaderId, uploaderName, createdAt);
}

export function getFileById(id) {
  return db.prepare("SELECT * FROM files WHERE _id = ?").get(id);
}

export function incrementFileDownloadCount(id) {
  db.prepare("UPDATE files SET download_count = download_count + 1 WHERE _id = ?").run(id);
}

export function deleteFileRecord(id) {
  db.prepare("DELETE FROM files WHERE _id = ?").run(id);
}

// ─── Topics ───────────────────────────────────────────────
export function getTopics() {
  return db.prepare("SELECT * FROM topics ORDER BY created_at DESC").all();
}

export function getTopicById(id) {
  return db.prepare("SELECT * FROM topics WHERE _id = ?").get(id);
}

export function createTopic({ _id, title, content, authorId, authorName, createdAt }) {
  db.prepare(
    "INSERT INTO topics (_id, title, content, author_id, author_name, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(_id, title, content, authorId, authorName, createdAt);
}

export function deleteTopic(id) {
  const del = db.transaction(() => {
    db.prepare("DELETE FROM topics WHERE _id = ?").run(id);
    db.prepare("DELETE FROM topic_comments WHERE topic_id = ?").run(id);
    db.prepare("DELETE FROM topic_likes WHERE topic_id = ?").run(id);
  });
  del();
}

export function incTopicCommentsCount(id, delta) {
  db.prepare("UPDATE topics SET comments_count = comments_count + ? WHERE _id = ?").run(delta, id);
}

export function incTopicLikesCount(id, delta) {
  db.prepare("UPDATE topics SET likes_count = likes_count + ? WHERE _id = ?").run(delta, id);
}

// ─── Topic Comments ───────────────────────────────────────
export function getTopicComments(topicId) {
  return db.prepare("SELECT * FROM topic_comments WHERE topic_id = ? ORDER BY created_at ASC").all(topicId);
}

export function createTopicComment({ _id, topicId, authorId, authorName, content, createdAt }) {
  db.prepare(
    "INSERT INTO topic_comments (_id, topic_id, author_id, author_name, content, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(_id, topicId, authorId, authorName, content, createdAt);
}

export function getTopicCommentById(id) {
  return db.prepare("SELECT * FROM topic_comments WHERE _id = ?").get(id);
}

export function deleteTopicComment(id) {
  db.prepare("DELETE FROM topic_comments WHERE _id = ?").run(id);
}

// ─── Topic Likes ──────────────────────────────────────────
export function hasTopicLiked(topicId, userId) {
  return db.prepare("SELECT 1 FROM topic_likes WHERE topic_id = ? AND user_id = ?").get(topicId, userId);
}

export function addTopicLike(topicId, userId, createdAt) {
  db.prepare("INSERT OR IGNORE INTO topic_likes (topic_id, user_id, created_at) VALUES (?, ?, ?)").run(topicId, userId, createdAt);
}

export function removeTopicLike(topicId, userId) {
  db.prepare("DELETE FROM topic_likes WHERE topic_id = ? AND user_id = ?").run(topicId, userId);
}

// ─── Seeding check ────────────────────────────────────────
export function isSeeded() {
  return db.prepare("SELECT 1 FROM articles LIMIT 1").get();
}

export function seedUsers() {
  const adminExists = db.prepare("SELECT 1 FROM users WHERE username = ?").get("admin");
  if (adminExists) return;

  const now = new Date().toISOString();
  const salt = bcrypt.genSaltSync(10);

  db.prepare(
    "INSERT INTO users (_id, username, password, nickname, role, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(crypto.randomUUID(), "admin", bcrypt.hashSync("Admin@2026", salt), "管理员", "admin", now);

  db.prepare(
    "INSERT INTO users (_id, username, password, nickname, role, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(crypto.randomUUID(), "user", bcrypt.hashSync("User@2026", salt), "普通用户", "user", now);
}

export default db;
