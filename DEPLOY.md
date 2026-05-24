# 部署指南 — 自建服务器

## 环境要求

- **Node.js** >= 18（推荐 20 LTS）
- **Nginx**（反向代理）
- **PM2**（进程管理）

## 快速部署

### 1. 将项目上传到服务器

```bash
# 在服务器上
git clone <你的仓库地址> /var/www/blog
cd /var/www/blog
```

### 2. 配置后端

```bash
# 安装后端依赖
cd server
npm install

# 编辑配置
cp .env .env.local  # 或直接编辑 .env
```

**server/.env 配置说明：**

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `JWT_SECRET` | **必填** JWT 签名密钥，生成一个随机字符串 | `change-this-to-a-random-string-in-production` |
| `PORT` | 后端监听端口 | `3000` |
| `UPLOAD_DIR` | 文件上传目录 | `./uploads` |
| `AI_API_KEY` | 可选，AI API 密钥（DeepSeek/OpenAI 等） | 空（不配置则 AI 对话功能不可用） |
| `AI_API_URL` | AI API 地址 | `https://api.deepseek.com` |
| `AI_MODEL` | AI 模型名 | `deepseek-chat` |

### 3. 构建前端

```bash
cd ..
npm install
npm run build
```

### 4. 使用 PM2 启动后端

```bash
cd server
npm install -g pm2  # 如果未安装
pm2 start src/index.js --name blog-server
pm2 save
pm2 startup        # 设置开机自启
```

### 5. 配置 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 改为你的域名或服务器IP

    client_max_body_size 100m;    # 支持大文件上传

    location / {
        root /var/www/blog/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 6. 配置 HTTPS（推荐）

```bash
# 使用 certbot 获取 SSL 证书
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 开发环境

```bash
# 终端 1：启动后端
cd server
npm run dev

# 终端 2：启动前端开发服务器（自动代理 API 到后端）
cd ..
npm run dev
```

前端开发服务器在 `http://localhost:5173`，会自动将 `/api/*` 和 `/uploads/*` 请求代理到后端 `http://localhost:3000`。

## 从 CloudBase 迁移数据

如果需要将 CloudBase 上的现有数据迁移到 SQLite，可以使用以下方法：

```bash
# 安装临时依赖
npm install @cloudbase/js-sdk

# 运行迁移脚本（需要 VITE_ENV_ID 和 VITE_PUBLISHABLE_KEY）
node server/scripts/migrate.js
```

或者手动在管理后台重新创建数据。

## 目录结构

```
blog/
├── server/              # 后端服务
│   ├── src/
│   │   ├── index.js         # 入口
│   │   ├── db.js            # SQLite 数据库操作
│   │   ├── middleware/
│   │   │   └── auth.js      # JWT 认证中间件
│   │   └── routes/
│   │       ├── auth.js      # 注册/登录
│   │       ├── articles.js  # 文章 CRUD
│   │       ├── comments.js  # 评论 CRUD
│   │       ├── likes.js     # 点赞
│   │       ├── messages.js  # 闲聊消息
│   │       ├── files.js     # 文件上传/下载
│   │       ├── topics.js    # 话题 CRUD
│   │       ├── admin.js     # 管理员接口
│   │       └── ai.js        # AI 对话代理
│   ├── uploads/         # 上传文件存储目录
│   ├── data.db          # SQLite 数据库文件（自动创建）
│   ├── .env             # 环境配置
│   └── package.json
├── src/                 # 前端源码
│   ├── utils/
│   │   ├── api.ts       # API 客户端（替代 cloudbase.ts）
│   │   └── db.ts        # 数据操作层（调用 API）
│   └── ...
├── dist/                # 构建产物
├── .env                 # 前端环境变量（VITE_API_URL）
└── package.json
```
