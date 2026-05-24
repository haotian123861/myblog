const API_BASE = import.meta.env.VITE_API_URL || "";

function getToken(): string | null {
  try {
    return localStorage.getItem("blog_token");
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem("blog_token", token);
  } else {
    localStorage.removeItem("blog_token");
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string>) },
  });

  const data = await res.json();

  if (!data.success) {
    throw new Error(data.error || "请求失败");
  }

  return data.data as T;
}

// ─── Auth ─────────────────────────────────────────────────
export const api = {
  auth: {
    register: (data: { username: string; password: string; nickname?: string }) =>
      request<{ token: string; user: any }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    login: (data: { username: string; password: string }) =>
      request<{ token: string; user: any }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    me: () => request<{ user: any }>("/auth/me"),
  },

  articles: {
    list: () => request<any[]>("/articles"),
    get: (id: string) => request<any>(`/articles/${id}`),
    create: (data: { title: string; content: string; summary?: string; tags?: string[]; coverImage?: string }) =>
      request<{ _id: string }>("/articles", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<void>(`/articles/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<void>(`/articles/${id}`, { method: "DELETE" }),
  },

  comments: {
    list: (articleId: string) => request<any[]>(`/comments/article/${articleId}`),
    create: (articleId: string, content: string) =>
      request<{ _id: string }>(`/comments/article/${articleId}`, {
        method: "POST",
        body: JSON.stringify({ content }),
      }),
    delete: (id: string) =>
      request<void>(`/comments/${id}`, { method: "DELETE" }),
  },

  likes: {
    toggle: (articleId: string) =>
      request<{ liked: boolean }>(`/likes/${articleId}`, { method: "POST" }),
  },

  messages: {
    list: () => request<any[]>("/messages"),
    create: (content: string) =>
      request<{ _id: string }>("/messages", {
        method: "POST",
        body: JSON.stringify({ content }),
      }),
  },

  fileCategories: {
    list: () => request<any[]>("/files/categories"),
    create: (name: string) =>
      request<{ _id: string }>("/files/categories", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    delete: (id: string) =>
      request<void>(`/files/categories/${id}`, { method: "DELETE" }),
  },

  files: {
    list: () => request<any[]>("/files"),
    upload: (file: File, categoryId: string) => {
      const form = new FormData();
      form.append("file", file);
      form.append("categoryId", categoryId);
      return request<any>("/files/upload", {
        method: "POST",
        body: form,
      });
    },
    download: (id: string) =>
      request<{ url: string }>(`/files/${id}/download`, { method: "POST" }),
    delete: (id: string) =>
      request<void>(`/files/${id}`, { method: "DELETE" }),
  },

  topics: {
    list: () => request<any[]>("/topics"),
    create: (data: { title: string; content: string }) =>
      request<{ _id: string }>("/topics", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<void>(`/topics/${id}`, { method: "DELETE" }),
    comments: {
      list: (topicId: string) => request<any[]>(`/topics/${topicId}/comments`),
      create: (topicId: string, content: string) =>
        request<{ _id: string }>(`/topics/${topicId}/comments`, {
          method: "POST",
          body: JSON.stringify({ content }),
        }),
      delete: (id: string) =>
        request<void>(`/topics/topic-comments/${id}`, { method: "DELETE" }),
    },
    likes: {
      toggle: (topicId: string) =>
        request<{ liked: boolean }>(`/topics/${topicId}/like`, { method: "POST" }),
    },
  },

  admin: {
    users: {
      list: () => request<any[]>("/admin/users"),
      setRole: (uid: string, role: "admin" | "user") =>
        request<void>(`/admin/users/${uid}/role`, {
          method: "PUT",
          body: JSON.stringify({ role }),
        }),
      delete: (uid: string) =>
        request<void>(`/admin/users/${uid}`, { method: "DELETE" }),
    },
  },
};

export default api;
