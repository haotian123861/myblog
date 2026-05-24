export type UserRole = "admin" | "user";

export interface AppUser {
  uid: string;
  username: string;
  password: string;
  nickname: string;
  avatarUrl?: string;
  role: UserRole;
  createdAt: string;
}

export interface Article {
  _id: string;
  title: string;
  content: string;
  summary: string;
  coverImage?: string;
  tags: string[];
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  commentsCount: number;
}

export interface ChatMessage {
  _id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface Topic {
  _id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
}

export interface TopicComment {
  _id: string;
  topicId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface TopicLike {
  _id: string;
  topicId: string;
  userId: string;
  createdAt: string;
}

export interface BlogFileCategory {
  _id: string;
  name: string;
  createdAt: string;
}

export interface BlogFileItem {
  _id: string;
  originalName: string;
  fileId?: string;
  storedPath?: string;
  size: number;
  categoryId: string;
  uploaderId: string;
  uploaderName: string;
  downloadCount: number;
  createdAt: string;
}

export interface Comment {
  _id: string;
  articleId: string;
  authorId: string;
  authorName: string;
  avatarUrl?: string;
  content: string;
  createdAt: string;
}

export interface Like {
  _id: string;
  articleId: string;
  userId: string;
  createdAt: string;
}

export interface BlogData {
  users: Record<string, AppUser>;
  articles: Article[];
  comments: Comment[];
  likes: Like[];
}
