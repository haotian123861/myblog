# 浩天的学习分享 — 个人博客

一个基于 React 19 + TypeScript + Vite 的个人博客系统，使用自建 Node.js + Express + SQLite 后端。

## 功能

- 📝 **文章管理** — 撰写、编辑、删除文章（支持 Markdown 渲染）
- 💬 **评论系统** — 登录后评论，支持管理员和作者删除
- ❤️ **点赞功能** — 登录后可点赞
- 💭 **闲聊室** — 自由交流的消息板
- 📁 **文件分享** — 上传下载文件，分类管理
- 👥 **用户系统** — 注册/登录，普通用户和管理员角色
- 🤖 **AI 智能** — 基于 DeepSeek 的对话与翻译（需配置 API Key）
- 🔒 **管理后台** — 文章管理、用户管理、角色分配

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 构建工具 | Vite 6 |
| 路由 | React Router 6（HashRouter） |
| 样式 | Tailwind CSS 3 + 自定义暖色主题 |
| 图标 | Font Awesome |
| Markdown | marked + DOMPurify |
| 后端 | Node.js + Express |
| 数据库 | SQLite（better-sqlite3） |
| 认证 | JWT + bcrypt |
| 文件存储 | 本地文件系统 |
| 进程管理 | PM2 |
| 反向代理 | Nginx |

## 快速开始

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server && npm install && cd ..

# 启动后端（终端 1）
cd server && npm run dev

# 启动前端开发服务器（终端 2）
npm run dev
```

访问 `http://localhost:5173`

## 部署

详见 [DEPLOY.md](DEPLOY.md)

## 项目结构

```
├── server/                # 后端服务
│   ├── src/
│   │   ├── index.js          # Express 入口
│   │   ├── db.js             # SQLite 数据库操作
│   │   ├── middleware/auth.js # JWT 认证
│   │   └── routes/           # API 路由
│   ├── uploads/              # 上传文件
│   └── .env                  # 后端配置
├── src/                   # 前端源码
│   ├── components/        # 可复用组件
│   ├── pages/             # 页面
│   ├── context/           # React Context
│   ├── utils/
│   │   ├── api.ts         # API 客户端
│   │   └── db.ts          # 数据操作层
│   └── types/index.ts     # 类型定义
└── dist/                  # 构建产物
```

## 架构迁移说明

此项目原使用腾讯云开发（CloudBase）作为后端（云函数 + NoSQL 数据库 + 云存储），现已迁移到自建后端架构。

**主要变更：**
- CloudBase JS SDK → 自建 Express REST API
- CloudBase 云函数（loginUser/registerUser）→ Express 路由 + JWT
- CloudBase NoSQL 数据库 → SQLite
- CloudBase 云存储 → 本地文件系统
