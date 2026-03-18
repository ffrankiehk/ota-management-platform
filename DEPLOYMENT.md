# OTA Platform Cloud Deployment Guide

完整的雲端部署指南，支持多種雲平台。

## 📋 目錄

1. [部署選項對比](#部署選項對比)
2. [快速部署 - DigitalOcean](#快速部署---digitalocean)
3. [AWS 部署](#aws-部署)
4. [Railway 部署（最簡單）](#railway-部署)
5. [環境配置](#環境配置)
6. [域名和 SSL 配置](#域名和-ssl-配置)

---

## 部署選項對比

| 平台 | 難度 | 月費用 | 優點 | 缺點 |
|------|------|--------|------|------|
| **Railway** | ⭐ 簡單 | $5-20 | 一鍵部署、自動 SSL | 較貴 |
| **DigitalOcean** | ⭐⭐ 中等 | $12-24 | 性價比高、穩定 | 需手動配置 |
| **AWS** | ⭐⭐⭐ 複雜 | $15-30 | 功能最全、可擴展 | 配置複雜 |
| **Heroku** | ⭐ 簡單 | $7-25 | 簡單易用 | 較貴 |

**推薦：Railway（測試）或 DigitalOcean（生產）**

---

## 快速部署 - DigitalOcean

### 預估成本
- **Droplet (2GB RAM)**: $12/月
- **Managed PostgreSQL**: $15/月（可選，或用 Docker）
- **總計**: $12-27/月

### Step 1: 創建 Droplet

1. 登入 [DigitalOcean](https://www.digitalocean.com)
2. Create → Droplets
3. 選擇配置：
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic - $12/mo (2GB RAM, 1 CPU)
   - **Region**: Singapore（亞洲用戶）
   - **Authentication**: SSH Key（推薦）或 Password

### Step 2: 連接到服務器

```bash
ssh root@your-droplet-ip
```

### Step 3: 安裝 Docker

```bash
# 更新系統
apt update && apt upgrade -y

# 安裝 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 安裝 Docker Compose
apt install docker-compose -y

# 驗證安裝
docker --version
docker-compose --version
```

### Step 4: 部署 OTA Platform

```bash
# 創建項目目錄
mkdir -p /opt/ota-platform
cd /opt/ota-platform

# 克隆代碼（或上傳）
git clone <your-repo-url> .
# 或使用 scp 上傳：
# scp -r C:\xampp-AMC\htdocs\ota-management-platform root@your-ip:/opt/ota-platform

# 創建生產環境配置
cat > .env.production << 'EOF'
# Database
DATABASE_URL=postgresql://ota_user:CHANGE_THIS_PASSWORD@postgres:5432/ota_platform

# Redis
REDIS_URL=redis://redis:6379

# MinIO
STORAGE_TYPE=minio
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=CHANGE_THIS_KEY
MINIO_SECRET_KEY=CHANGE_THIS_SECRET
MINIO_BUCKET=ota-bundles

# JWT
JWT_SECRET=CHANGE_THIS_TO_RANDOM_STRING_AT_LEAST_32_CHARS
JWT_EXPIRES_IN=7d

# API
API_PORT=3000
API_HOST=0.0.0.0
CORS_ORIGIN=https://your-domain.com

# Dashboard
VITE_API_URL=https://api.your-domain.com

# Environment
NODE_ENV=production
LOG_LEVEL=info
EOF

# 啟動服務
docker-compose up -d postgres redis minio
docker-compose --profile dev up -d
```

### Step 5: 配置 Nginx 反向代理

```bash
# 安裝 Nginx
apt install nginx -y

# 創建 API 配置
cat > /etc/nginx/sites-available/ota-api << 'EOF'
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# 創建 Dashboard 配置
cat > /etc/nginx/sites-available/ota-dashboard << 'EOF'
server {
    listen 80;
    server_name ota.your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# 啟用配置
ln -s /etc/nginx/sites-available/ota-api /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/ota-dashboard /etc/nginx/sites-enabled/

# 測試配置
nginx -t

# 重啟 Nginx
systemctl restart nginx
```

### Step 6: 配置 SSL（Let's Encrypt）

```bash
# 安裝 Certbot
apt install certbot python3-certbot-nginx -y

# 獲取 SSL 證書
certbot --nginx -d api.your-domain.com -d ota.your-domain.com

# 自動續期
certbot renew --dry-run
```

### Step 7: 配置防火牆

```bash
# 允許 HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp

# 啟用防火牆
ufw enable
```

---

## Railway 部署（最簡單）

### 優點
- ✅ 一鍵部署
- ✅ 自動 SSL
- ✅ 自動擴展
- ✅ 內建數據庫

### Step 1: 準備代碼

創建 `railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Step 2: 部署

1. 訪問 [Railway.app](https://railway.app)
2. 連接 GitHub 倉庫
3. 添加服務：
   - PostgreSQL（自動）
   - Redis（自動）
   - API（從代碼）
   - Dashboard（從代碼）

### Step 3: 配置環境變量

在 Railway Dashboard 中設置：

```
DATABASE_URL=${DATABASE_URL}  # 自動提供
REDIS_URL=${REDIS_URL}        # 自動提供
JWT_SECRET=your-secret-key
VITE_API_URL=https://your-api.railway.app
```

### Step 4: 部署完成

Railway 會自動：
- 構建 Docker 容器
- 分配域名
- 配置 SSL
- 啟動服務

**成本**: ~$5-20/月（按使用量計費）

---

## AWS 部署

### 使用 AWS ECS + RDS

#### 預估成本
- **ECS Fargate**: $15-30/月
- **RDS PostgreSQL**: $15-25/月
- **ALB**: $16/月
- **總計**: $46-71/月

#### 部署步驟

1. **創建 RDS PostgreSQL**
   ```bash
   aws rds create-db-instance \
     --db-instance-identifier ota-db \
     --db-instance-class db.t3.micro \
     --engine postgres \
     --master-username ota_user \
     --master-user-password YOUR_PASSWORD \
     --allocated-storage 20
   ```

2. **創建 ECR 倉庫**
   ```bash
   aws ecr create-repository --repository-name ota-api
   aws ecr create-repository --repository-name ota-dashboard
   ```

3. **構建並推送 Docker 鏡像**
   ```bash
   # 登入 ECR
   aws ecr get-login-password --region ap-southeast-1 | \
     docker login --username AWS --password-stdin YOUR_ECR_URL

   # 構建並推送
   docker build -f packages/api/Dockerfile -t ota-api .
   docker tag ota-api:latest YOUR_ECR_URL/ota-api:latest
   docker push YOUR_ECR_URL/ota-api:latest
   ```

4. **創建 ECS 集群和服務**
   - 使用 AWS Console 或 Terraform
   - 配置 Task Definition
   - 設置 Load Balancer

---

## 環境配置

### 生產環境 `.env` 模板

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Redis
REDIS_URL=redis://host:6379

# Storage (MinIO or S3)
STORAGE_TYPE=minio  # or 's3'
MINIO_ENDPOINT=minio.your-domain.com:9000
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key
MINIO_BUCKET=ota-bundles

# AWS S3 (if using S3)
# AWS_ACCESS_KEY_ID=your-key
# AWS_SECRET_ACCESS_KEY=your-secret
# AWS_REGION=ap-southeast-1
# S3_BUCKET=your-bucket

# JWT
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_EXPIRES_IN=7d

# API
API_PORT=3000
API_HOST=0.0.0.0
CORS_ORIGIN=https://ota.your-domain.com

# Dashboard
VITE_API_URL=https://api.your-domain.com

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Environment
NODE_ENV=production
```

### 生成安全密鑰

```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# MinIO Keys
node -e "console.log(require('crypto').randomBytes(20).toString('hex'))"
```

---

## 域名和 SSL 配置

### 1. 配置 DNS

在你的域名提供商（如 Cloudflare、GoDaddy）添加 A 記錄：

```
api.your-domain.com  → YOUR_SERVER_IP
ota.your-domain.com  → YOUR_SERVER_IP
```

### 2. 使用 Cloudflare（推薦）

優點：
- ✅ 免費 SSL
- ✅ CDN 加速
- ✅ DDoS 防護
- ✅ 自動 HTTPS

步驟：
1. 添加域名到 Cloudflare
2. 更新 Nameservers
3. 設置 DNS 記錄
4. 啟用 SSL/TLS（Full mode）

---

## 監控和維護

### 1. 日誌查看

```bash
# 查看所有服務日誌
docker-compose logs -f

# 查看特定服務
docker-compose logs -f api
docker-compose logs -f dashboard
```

### 2. 數據庫備份

```bash
# 手動備份
docker exec ota_postgres pg_dump -U ota_user ota_platform > backup.sql

# 自動備份（crontab）
0 2 * * * docker exec ota_postgres pg_dump -U ota_user ota_platform > /backups/ota_$(date +\%Y\%m\%d).sql
```

### 3. 更新部署

```bash
# 拉取最新代碼
git pull

# 重新構建並啟動
docker-compose build
docker-compose up -d
```

---

## 故障排除

### 問題：無法連接數據庫

```bash
# 檢查 PostgreSQL 狀態
docker-compose ps postgres

# 查看日誌
docker-compose logs postgres

# 測試連接
docker exec -it ota_postgres psql -U ota_user -d ota_platform
```

### 問題：API 無法訪問

```bash
# 檢查 API 狀態
docker-compose ps api

# 查看日誌
docker-compose logs api

# 檢查端口
netstat -tulpn | grep 3000
```

### 問題：SSL 證書錯誤

```bash
# 重新獲取證書
certbot renew --force-renewal

# 檢查證書狀態
certbot certificates
```

---

## 安全建議

1. ✅ **使用強密碼** - 所有數據庫和服務
2. ✅ **啟用防火牆** - 只開放必要端口
3. ✅ **定期更新** - 系統和 Docker 鏡像
4. ✅ **配置 SSL** - 所有生產環境
5. ✅ **限制訪問** - 使用 IP 白名單（如需要）
6. ✅ **監控日誌** - 設置異常告警
7. ✅ **定期備份** - 數據庫和文件

---

## 推薦配置

### 測試環境
- **平台**: Railway
- **成本**: $5-10/月
- **時間**: 10 分鐘

### 生產環境
- **平台**: DigitalOcean
- **配置**: 2GB Droplet + Managed PostgreSQL
- **成本**: $27/月
- **時間**: 1-2 小時

---

## 下一步

1. ✅ 選擇部署平台
2. ✅ 配置域名
3. ✅ 部署服務
4. ✅ 配置 SSL
5. ✅ 測試 OTA 更新
6. ✅ 集成到 AMC App

需要幫助？參考 [COMPLETE_GUIDE.md](./COMPLETE_GUIDE.md)
