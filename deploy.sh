#!/bin/bash

echo "🚀 OTA Platform 部署腳本"
echo "========================"

# 檢查 Docker
if ! command -v docker &> /dev/null; then
    echo "📦 安裝 Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
fi

if ! command -v docker-compose &> /dev/null; then
    echo "📦 安裝 Docker Compose..."
    sudo apt install -y docker-compose
fi

echo "✅ Docker 已安裝"

# 生成 JWT Secret
JWT_SECRET=$(openssl rand -hex 32)

# 創建環境配置
echo "📝 創建環境配置..."
cat > .env.production << EOF
DATABASE_URL=postgresql://ota_user:OTA_Pass_2024_Secure@postgres:5432/ota_platform
REDIS_URL=redis://redis:6379
STORAGE_TYPE=minio
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin2024
MINIO_SECRET_KEY=minioadmin2024SecureKey
MINIO_BUCKET=ota-bundles
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
API_PORT=3000
API_HOST=0.0.0.0
CORS_ORIGIN=http://34.143.178.171:3001
VITE_API_URL=http://34.143.178.171:3000
NODE_ENV=production
LOG_LEVEL=info
LOG_FORMAT=json
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

echo "✅ 環境配置已創建"

# 啟動服務
echo "🚀 啟動服務..."
docker-compose up -d postgres redis minio

echo "⏳ 等待數據庫啟動..."
sleep 15

echo "🚀 啟動 API 和 Dashboard..."
docker-compose --profile dev up -d

echo "⏳ 等待服務啟動..."
sleep 10

# 檢查狀態
echo ""
echo "📊 服務狀態："
docker-compose ps

echo ""
echo "✅ 部署完成！"
echo ""
echo "🌐 訪問地址："
echo "   API: http://34.143.178.171:3000"
echo "   Dashboard: http://34.143.178.171:3001"
echo ""
echo "📝 查看日誌："
echo "   docker-compose logs -f"
echo ""
