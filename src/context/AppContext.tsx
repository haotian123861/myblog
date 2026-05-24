import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { Article, BlogFileCategory, BlogFileItem, ChatMessage, Comment, Topic } from "../types";
import db from "../utils/db";
import api from "../utils/api";
import { nanoid } from "../utils/id";
import { useAuth } from "./AuthContext";
const API_BASE = import.meta.env.VITE_API_URL || "";

interface AppContextType {
  articles: Article[];
  loading: boolean;
  refreshArticles: () => void;
  getArticle: (id: string) => Promise<Article | undefined>;
  createArticle: (data: {
    title: string;
    content: string;
    summary: string;
    tags: string[];
    coverImage?: string;
  }) => Promise<string>;
  updateArticle: (
    id: string,
    data: Partial<{
      title: string;
      content: string;
      summary: string;
      tags: string[];
      coverImage: string;
    }>
  ) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;

  getComments: (articleId: string) => Promise<Comment[]>;
  addComment: (articleId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string, _articleId: string) => Promise<void>;

  hasLiked: (articleId: string) => Promise<boolean>;
  toggleLike: (articleId: string) => Promise<void>;

  messages: ChatMessage[];
  sendMessage: (content: string) => Promise<void>;

  files: BlogFileItem[];
  fileCategories: BlogFileCategory[];
  handleUpload: (file: File, categoryId: string) => Promise<void>;
  handleDownload: (file: BlogFileItem) => Promise<void>;
  handleDeleteFile: (id: string) => Promise<void>;
  createFileCategory: (name: string) => Promise<string>;
  deleteFileCategory: (id: string) => Promise<void>;

  topics: Topic[];
  createTopic: (title: string, content: string) => Promise<void>;
  deleteTopic: (id: string) => Promise<void>;
  getTopicComments: (topicId: string) => Promise<any[]>;
  addTopicComment: (topicId: string, content: string) => Promise<void>;
  deleteTopicComment: (commentId: string) => Promise<void>;
  hasTopicLiked: (topicId: string) => Promise<boolean>;
  toggleTopicLike: (topicId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [files, setFiles] = useState<BlogFileItem[]>([]);
  const [fileCategories, setFileCategories] = useState<BlogFileCategory[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshArticles = useCallback(() => {
    db.getArticles()
      .then(setArticles)
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refreshArticles();
  }, [refreshArticles]);

  // Load messages
  const loadMessages = useCallback(async () => {
    const msgs = await db.getMessages();
    setMessages(msgs);
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Load files
  const loadFiles = useCallback(async () => {
    const list = await db.getFiles();
    setFiles(list);
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Load file categories
  const loadFileCategories = useCallback(async () => {
    const list = await db.getFileCategories();
    setFileCategories(list);
  }, []);

  useEffect(() => {
    loadFileCategories();
  }, [loadFileCategories]);

  // Load topics
  const loadTopics = useCallback(async () => {
    const list = await db.getTopics();
    setTopics(list);
  }, []);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  const getArticle = useCallback(async (id: string) => {
    return db.getArticleById(id);
  }, []);

  const createArticle = useCallback(
    async (data: {
      title: string;
      content: string;
      summary: string;
      tags: string[];
      coverImage?: string;
    }) => {
      const now = new Date().toISOString();
      const _id = nanoid();
      const article: Article = {
        _id,
        title: data.title,
        content: data.content,
        summary: data.summary,
        coverImage: data.coverImage,
        tags: data.tags,
        authorId: user?.uid || "",
        authorName: user?.nickname || "匿名",
        createdAt: now,
        updatedAt: now,
        likesCount: 0,
        commentsCount: 0,
      };
      await db.createArticle(article);
      await db.getArticles().then(setArticles);
      return _id;
    },
    [user]
  );

  const updateArticle = useCallback(
    async (
      id: string,
      data: Partial<{
        title: string;
        content: string;
        summary: string;
        tags: string[];
        coverImage: string;
      }>
    ) => {
      await db.updateArticle(id, { ...data, updatedAt: new Date().toISOString() });
      await db.getArticles().then(setArticles);
    },
    []
  );

  const deleteArticle = useCallback(async (id: string) => {
    await db.deleteArticle(id);
    await db.getArticles().then(setArticles);
  }, []);

  const getComments = useCallback(async (articleId: string) => {
    return db.getCommentsByArticle(articleId);
  }, []);

  const addComment = useCallback(
    async (articleId: string, content: string) => {
      if (!user) return;
      await db.createComment({
        _id: nanoid(),
        articleId,
        authorId: user.uid,
        authorName: user.nickname,
        content,
        createdAt: new Date().toISOString(),
      });
      await db.getArticles().then(setArticles);
    },
    [user]
  );

  const deleteComment = useCallback(
    async (commentId: string, _articleId: string) => {
      await db.deleteComment(commentId);
      await db.getArticles().then(setArticles);
    },
    []
  );

  const hasLiked = useCallback(
    async (articleId: string) => {
      if (!user) return false;
      // Use the toggle endpoint which returns current state
      return db.hasLiked(articleId, user.uid);
    },
    [user]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!user) return;
      await db.createMessage(content, user.uid, user.nickname);
      await loadMessages();
    },
    [user, loadMessages]
  );

  const handleUpload = useCallback(
    async (file: File, categoryId: string) => {
      if (!user) return;
      await api.files.upload(file, categoryId);
      await loadFiles();
    },
    [user, loadFiles]
  );

  const handleDownload = useCallback(
    async (file: BlogFileItem) => {
      try {
        const { url } = await api.files.download(file._id);
        window.open(`${API_BASE}${url}`, "_blank");
      } catch {
        // If the file record has a storedPath, try constructing URL directly
        if (file.storedPath) {
          window.open(`${API_BASE}/uploads/${file.storedPath}`, "_blank");
        }
      }
      await loadFiles();
    },
    [loadFiles]
  );

  const handleDeleteFile = useCallback(
    async (id: string) => {
      await api.files.delete(id);
      await loadFiles();
    },
    [loadFiles]
  );

  const createFileCategory = useCallback(
    async (name: string): Promise<string> => {
      const result = await api.fileCategories.create(name);
      await loadFileCategories();
      return result._id;
    },
    [loadFileCategories]
  );

  const deleteFileCategory = useCallback(
    async (id: string) => {
      await api.fileCategories.delete(id);
      await loadFileCategories();
    },
    [loadFileCategories]
  );

  const createTopic = useCallback(
    async (title: string, content: string) => {
      if (!user) return;
      await db.createTopic({
        _id: nanoid(),
        title,
        content,
        authorId: user.uid,
        authorName: user.nickname,
        likesCount: 0,
        commentsCount: 0,
        createdAt: new Date().toISOString(),
      });
      await loadTopics();
    },
    [user, loadTopics]
  );

  const deleteTopic = useCallback(
    async (id: string) => {
      if (!user) throw new Error("未登录");
      await db.deleteTopic(id, user.uid, user.role);
      await loadTopics();
    },
    [user, loadTopics]
  );

  const getTopicComments = useCallback(async (topicId: string) => {
    return db.getTopicComments(topicId);
  }, []);

  const addTopicComment = useCallback(
    async (topicId: string, content: string) => {
      if (!user) return;
      await db.createTopicComment({
        _id: nanoid(),
        topicId,
        authorId: user.uid,
        authorName: user.nickname,
        content,
        createdAt: new Date().toISOString(),
      });
      await loadTopics();
    },
    [user, loadTopics]
  );

  const deleteTopicComment = useCallback(
    async (commentId: string) => {
      await db.deleteTopicComment(commentId);
    },
    []
  );

  const hasTopicLiked = useCallback(
    async (topicId: string) => {
      if (!user) return false;
      return db.hasTopicLiked(topicId, user.uid);
    },
    [user]
  );

  const toggleTopicLike = useCallback(
    async (topicId: string) => {
      if (!user) return;
      await db.toggleTopicLike(topicId, user.uid);
      await loadTopics();
    },
    [user, loadTopics]
  );

  const toggleLike = useCallback(
    async (articleId: string) => {
      if (!user) return;
      await db.toggleLike(articleId, user.uid);
      await db.getArticles().then(setArticles);
    },
    [user]
  );

  return (
    <AppContext.Provider
      value={{
        articles,
        loading,
        refreshArticles,
        getArticle,
        createArticle,
        updateArticle,
        deleteArticle,
        getComments,
        addComment,
        deleteComment,
        hasLiked,
        toggleLike,
        messages,
        sendMessage,
        files,
        fileCategories,
        handleUpload,
        handleDownload,
        handleDeleteFile,
        createFileCategory,
        deleteFileCategory,

        topics,
        createTopic,
        deleteTopic,
        getTopicComments,
        addTopicComment,
        deleteTopicComment,
        hasTopicLiked,
        toggleTopicLike,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
