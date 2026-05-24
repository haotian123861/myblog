# 阿里云轻量服务器部署指南

## 1. 安全组配置（防火墙）

登录阿里云控制台 → 轻量应用服务器 → 你的实例 → **防火墙**

添加以下规则：

| 协议 | 端口 | 备注 |
|------|------|------|
| TCP | 80 | HTTP |
| TCP | 443 | HTTPS（如果需要配置） |
| TCP | 3000 | 仅测试用，配好 Nginx 后可关 |

## 2. 连接服务器

```bash
# 从本地终端连接（阿里云控制台可查看公网 IP）
ssh root@你的服务器公网IP
```

## 3. 安装 Node.js

```bash
# Ubuntu/Debian 系统
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 验证
node -v   # 应输出 v20.x
npm -v
```

## 4. 上传项目文件

在本地终端（**不是服务器上**）执行：

```bash
# 方法一：SCP 上传（最直接）
cd D:\blog
scp -r dist server package.json package-lock.json root@你的服务器IP:/root/blog/

# 方法二：用 git（推荐，方便后续更新）
# 先在本地提交代码到 git 仓库，然后在服务器上 git clone
```

## 5. 服务器上安装依赖并配置

```bash
# 在服务器上
cd /root/blog/server

# 安装后端依赖
npm install

# 创建配置文件（用下面生成的密钥）
cat > .env << 'EOF'
JWT_SECRET=ba07e6998a19ab693554ae03038f17f1303e19e5633b9516f0a9b74433371007
PORT=3000
UPLOAD_DIR=./uploads
# AI_API_KEY=  # 可选，配置后启用 AI 对话功能
# AI_API_URL=https://api.deepseek.com
# AI_MODEL=deepseek-chat
EOF
```

## 6. 安装 PM2 并启动后端

```bash
# 安装 PM2
npm install -g pm2

# 启动项目
cd /root/blog/server
pm2 start src/index.js --name blog-server

# 设置开机自启
pm2 save
pm2 startup
```

此时项目已经在 `http://你的服务器IP:3000` 运行了，但直接暴露端口不安全，下一步配置 Nginx。

## 7. 安装并配置 Nginx

```bash
# 安装 Nginx
apt-get install -y nginx

# 创建站点配置
cat > /etc/nginx/sites-available/blog << 'EOF'
server {
    listen 80;
    server_name _;  # 如果有域名，替换为你的域名

    client_max_body_size 100m;

    # 前端静态文件
    root /root/blog/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 请求转发到后端
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

    # 上传文件
    location /uploads/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
EOF

# 启用站点（Ubuntu）
ln -s /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 检查配置
nginx -t

# 重启 Nginx
systemctl restart nginx
systemctl enable nginx
```

**如果是 CentOS/Alibaba Cloud Linux：**
```bash
# 配置文件位置不同
cat > /etc/nginx/conf.d/blog.conf << 'EOF'
# 同上配置内容
EOF

rm -f /etc/nginx/conf.d/default.conf
nginx -t
systemctl restart nginx
```

## 8. 访问

浏览器打开 `http://你的服务器公网IP`

不出意外就能看到你的博客了！

## 9. 可选：配置 HTTPS

如果你有域名：

```bash
# 安装 certbot
apt-get install -y certbot python3-certbot-nginx

# 申请证书（替换 yourdomain.com 为你的域名）
certbot --nginx -d yourdomain.com

# 自动续期
certbot renew --dry-run
```

## 10. 后续更新

```bash
# 本地修改代码后
npm run build
scp -r dist root@你的服务器IP:/root/blog/

# 服务器上重启
pm2 restart blog-server
```

## 常用命令

```bash
# 查看运行状态
pm2 status
pm2 logs blog-server

# 查看实时日志
pm2 logs blog-server --lines 50

# 重启
pm2 restart blog-server

# 停止
pm2 stop blog-server
```
