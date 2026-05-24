import api from "./api";
import type { AppUser, Article, BlogFileCategory, BlogFileItem, ChatMessage, Comment, Topic, TopicComment } from "../types";

function mapUser(row: any): AppUser {
  return {
    uid: row.uid || row._id,
    username: row.username,
    password: "",
    nickname: row.nickname,
    avatarUrl: row.avatarUrl,
    role: row.role,
    createdAt: row.createdAt,
  };
}

const db = {
  // ---- Users ----
  async getUserByUsername(username: string): Promise<AppUser | undefined> {
    try {
      const users = await api.admin.users.list();
      return users.find((u: any) => u.username === username) as AppUser | undefined;
    } catch {
      return undefined;
    }
  },

  async getUserById(uid: string): Promise<AppUser | undefined> {
    try {
      const users = await api.admin.users.list();
      return users.find((u: any) => (u.uid || u._id) === uid) as AppUser | undefined;
    } catch {
      return undefined;
    }
  },

  async setUserRole(uid: string, role: "admin" | "user") {
    await api.admin.users.setRole(uid, role);
  },

  async deleteUserData(uid: string) {
    await api.admin.users.delete(uid);
  },

  async createUser(_user: AppUser) {
    // Users are created via register - this is for admin seeding
    // No direct API for this in the new backend; register handles it
  },

  async getOrCreateProfile(uid: string, username: string, nickname?: string): Promise<AppUser> {
    const existing = await this.getUserById(uid);
    if (existing) return existing;
    // Fallback - return a basic profile
    return { uid, username, password: "", nickname: nickname || username, role: "user", createdAt: new Date().toISOString() };
  },

  async getAllUsers(): Promise<AppUser[]> {
    const users = await api.admin.users.list();
    return users.map(mapUser);
  },

  // ---- Articles ----
  async getArticles(): Promise<Article[]> {
    return api.articles.list();
  },

  async getArticleById(id: string): Promise<Article | undefined> {
    try {
      return await api.articles.get(id);
    } catch {
      return undefined;
    }
  },

  async createArticle(article: Article) {
    await api.articles.create({
      title: article.title,
      content: article.content,
      summary: article.summary,
      tags: article.tags,
      coverImage: article.coverImage,
    });
  },

  async updateArticle(id: string, updates: Partial<Article>) {
    await api.articles.update(id, updates);
  },

  async deleteArticle(id: string) {
    await api.articles.delete(id);
  },

  // ---- Comments ----
  async getCommentsByArticle(articleId: string): Promise<Comment[]> {
    return api.comments.list(articleId);
  },

  async createComment(comment: Comment) {
    await api.comments.create(comment.articleId, comment.content);
  },

  async deleteComment(commentId: string) {
    await api.comments.delete(commentId);
  },

  // ---- Likes ----
  async hasLiked(_articleId: string, _userId: string): Promise<boolean> {
    // The toggle endpoint handles this; individual check not needed
    return false;
  },

  async toggleLike(articleId: string, _userId: string): Promise<"liked" | "unliked"> {
    const result = await api.likes.toggle(articleId);
    return result.liked ? "liked" : "unliked";
  },

  // ---- Messages ----
  async getMessages(): Promise<ChatMessage[]> {
    return api.messages.list();
  },

  async createMessage(content: string, _authorId: string, _authorName: string) {
    await api.messages.create(content);
  },

  // ---- File Categories ----
  async getFileCategories(): Promise<BlogFileCategory[]> {
    return api.fileCategories.list();
  },

  async createFileCategory(name: string): Promise<string> {
    const result = await api.fileCategories.create(name);
    return result._id;
  },

  async deleteFileCategory(id: string) {
    await api.fileCategories.delete(id);
  },

  // ---- Files ----
  async getFiles(): Promise<BlogFileItem[]> {
    return api.files.list();
  },

  async createFileRecord(_data: Omit<BlogFileItem, "_id">) {
    // File records are created via the upload endpoint on the server
  },

  async incrementDownloadCount(fileId: string) {
    await api.files.download(fileId);
  },

  async deleteFileRecord(id: string) {
    await api.files.delete(id);
  },

  // ---- Topics ----
  async getTopics(): Promise<Topic[]> {
    return api.topics.list();
  },

  async createTopic(topic: Topic) {
    await api.topics.create({ title: topic.title, content: topic.content });
  },

  async deleteTopic(id: string, _callerUid: string, _callerRole: string) {
    await api.topics.delete(id);
  },

  async getTopicComments(topicId: string): Promise<TopicComment[]> {
    return api.topics.comments.list(topicId);
  },

  async createTopicComment(comment: TopicComment) {
    await api.topics.comments.create(comment.topicId, comment.content);
  },

  async deleteTopicComment(commentId: string) {
    await api.topics.comments.delete(commentId);
  },

  async hasTopicLiked(_topicId: string, _userId: string): Promise<boolean> {
    return false;
  },

  async toggleTopicLike(topicId: string, _userId: string): Promise<"liked" | "unliked"> {
    const result = await api.topics.likes.toggle(topicId);
    return result.liked ? "liked" : "unliked";
  },

  // ---- Seeding check ----
  async isSeeded(): Promise<boolean> {
    try {
      const articles = await this.getArticles();
      return articles.length > 0;
    } catch {
      return false;
    }
  },
};

export default db;
