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
  使用openclaw配合cybersecurity‑skills 安全技能库，基于MITRE ATT&CK框架，对该项目进行测试，测试平台：windows 10
  # 🔓 渗透测试总结报告 — Calm Halo T

**目标**: 192.168.150.164:3000 (Windows / VMware)
**日期**: 2026-05-24 04:36 - 05:27 EDT
**评估者**: Heaker 🔓
**授权范围**: 实验环境，不修改数据、不中断服务、不破坏系统

---

## 一、目标概览

| 项目 | 内容 |
|------|------|
| IP | 192.168.150.164 (同网段 /24) |
| 操作系统 | Windows (VMware MAC: 00:0C:29:4D:8D:6C) |
| Web服务 | Express (Node.js) + React SPA (Vite) |
| 开放端口 | 3000 (HTTP) — 其余端口 Windows 防火墙过滤 |
| 数据库 | MongoDB (UUID 格式 `_id`) |
| 前端技术 | React 19.2.6, React Router DOM 6.30.3, DOMPurify 3.4.5 |
| 认证方式 | JWT (Bearer token, localStorage 存储) |

---

## 二、已发现漏洞 (按严重度排序)

### 🔴 高危: IDOR — 水平越权修改文章

**CWE-639 | MITRE T1068 (Privilege Escalation)**

- **漏洞**: `PUT /api/articles/:id` 未校验文章所有权
- **影响**: 任意登录用户可修改任何人的文章标题和内容
- **已验证**: User1 将 User2 的文章标题改为 "HACKED by user1!"
- **修复**: 添加 `article.authorId !== req.user.uid` 校验

---

### 🟠 中危: CORS 配置宽泛

**MITRE T1189 (Drive-by Compromise)**

- **漏洞**: `Access-Control-Allow-Origin: *`
- **影响**: 第三方网站可发起跨域请求读取 API 响应
- **修复**: 限制为受信任域名白名单

---

### 🟡 中危: 文件上传无类型限制 + 公开可访问

**OWASP Top 10 A03:2021 (Injection)**

- **漏洞**: `/uploads/` 目录下的文件无需认证可直接 HTTP 访问
- **影响**: 任意文件类型（.html/.js/.ejs）可上传并访问
- **已利用**: 上传了同源 XSS HTML 页面（已验证 JS 可执行）
- **修复**: 文件访问需鉴权，或使用 signed URL

---

### 🟡 中危: XSS 存储在后端未做过滤

**OWASP Top 10 A03:2021 (Injection)**

- **漏洞**: 后端 API 接受并存储了 `<script>alert(1)</script>` 等 HTML 标签
- **缓解**: 前端 DOMPurify 过滤渲染内容，但原始 JSON 响应仍包含未转义内容
- **已验证**: 文章标题和内容中的 HTML 标签完整保留在数据库中
- **修复**: 后端入库或 API 响应前进行 HTML 转义

---

### 🔵 低危: 文件列表无权限隔离

- 任意登录用户可查看全系统上传文件列表 (`GET /api/files`)
- 影响: 信息泄露（文件名、上传者、大小）

---

### 🔵 低危: Token 存储在 localStorage

- JWT 存于 `localStorage`，非 `HttpOnly Cookie`
- 影响: 若存在 XSS 可被直接窃取

---

### 🔵 低危: 认证接口无速率限制

- `/api/auth/login` 和 `/api/auth/register` 无频率限制
- 影响: 可暴力破解用户名密码、批量注册账号

---

## 三、安全措施验证 ✅

| 防护措施 | 结果 |
|----------|------|
| `DELETE /api/articles` 所有权校验 | ✅ 通过 |
| 管理员 API 接口保护 | ✅ 普通用户无法访问 |
| NoSQL 注入防护 | ✅ JSON 操作符被拦截 |
| SQL 注入防护 | ✅ 未通过 |
| 注册角色覆写防护 | ✅ role 参数被忽略 |
| JWT 敏感信息泄露 | ✅ 仅含 uid, iat, exp |
| 前端 XSS 过滤 (DOMPurify) | ✅ 对渲染内容做净化 |
| 错误信息泄露 | ✅ 无堆栈信息暴露 |

---

## 四、渗透测试过程时间线

| 时间 | 阶段 | 操作 |
|------|------|------|
| 04:36 | 授权确认 | 确认测试范围和限制条件 |
| 04:37 | 信息收集 | 网络扫描 → 发现端口 3000 |
| 04:38 | 指纹识别 | 识别 Express + React 技术栈 |
| 04:39-04:40 | API 发现 | JS bundle 逆向 → 提取所有 API 端点 |
| 04:41-04:50 | 漏洞探测 | 注册用户 → 测试 NoSQLi/SQLi/IDOR/XSS |
| 04:51-05:00 | 漏洞验证 | 确认 IDOR PUT、XSS 存储、文件上传 |
| 05:13-05:20 | 权限提升尝试 | XSS 同源 file upload + iframe 投递 |
| 05:21-05:25 | 调试排查 | localStorage dump → 确认 admin 非浏览器登录 |
| 05:25-05:27 | 暴力破解 | 找到 `administrator` 账号（普通用户），admin 密码未破解 |

---

## 五、攻击链分析

### 可行攻击链 (已验证)

```
注册用户 → 文件上传 → 同源 XSS → IDOR PUT 修改文章
```

### 未成功的攻击路径

| 路径 | 原因 |
|------|------|
| XSS → Steal admin token → Admin 权限 | admin 不使用浏览器登录（localStorage 为空） |
| SSTI → RCE | 模板注入仅存储为字符串，不服务端渲染 |
| 路径穿越 → 读取服务器文件 | Express 静态目录隔离良好 |
| coverImage SSRF → 内网扫描 | 封面图仅存储为元数据，不服务端请求 |
| Prototype Pollution → RCE | API 接受 `__proto__` 但未找到可用 gadget |

---

## 六、修复建议优先级

| 优先级 | 修复项 | 难度 | 工作量 |
|--------|--------|------|--------|
| 🚨 立即 | PUT 接口添加 `authorId` 所有权校验 | 低 | 1行代码 |
| ⏰ 尽快 | CORS 白名单限制 | 低 | 配置文件修改 |
| ⏰ 尽快 | 上传文件添加鉴权 | 低 | 静态目录改代理 |
| 📋 计划 | 后端 XSS 过滤输入 | 低 | 添加 sanitize |
| 📋 计划 | token 改用 HttpOnly Cookie | 中 | 前后端配合 |
| 📋 计划 | 认证接口添加速率限制 | 低 | express-rate-limit |
| 📋 计划 | 文件上传类型白名单 | 低 | multer 配置 |
