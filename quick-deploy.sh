#!/bin/bash
set -e

echo "=== OTA Platform 快速部署 ==="

# 創建數據庫用戶
echo "[1/8] 配置數據庫..."
sudo -u postgres psql << 'EOSQL'
CREATE USER ota_user WITH PASSWORD 'OTA_Pass_2024';
GRANT ALL PRIVILEGES ON DATABASE ota_platform TO ota_user;
ALTER DATABASE ota_platform OWNER TO ota_user;
\q
EOSQL

# 創建 API 環境配置
echo "[2/8] 配置 API..."
mkdir -p ~/ota-platform/packages/api
cat > ~/ota-platform/packages/api/.env << 'EOF'
DATABASE_URL=postgresql://ota_user:OTA_Pass_2024@localhost:5432/ota_platform
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long-change-me
NODE_ENV=production
API_PORT=3000
API_HOST=0.0.0.0
CORS_ORIGIN=http://34.143.178.171:3001
LOG_LEVEL=info
EOF

# 創建 Dashboard 環境配置
echo "[3/8] 配置 Dashboard..."
mkdir -p ~/ota-platform/packages/dashboard
cat > ~/ota-platform/packages/dashboard/.env << 'EOF'
VITE_API_URL=http://34.143.178.171:3000
EOF

# 安裝依賴
echo "[4/8] 安裝依賴..."
cd ~/ota-platform
npm install

# 構建 shared package
echo "[5/8] 構建 shared..."
cd ~/ota-platform/packages/shared
npm run build || echo "Shared build skipped"

# 構建 API
echo "[6/8] 構建 API..."
cd ~/ota-platform/packages/api
npm run build

# 構建 Dashboard
echo "[7/8] 構建 Dashboard..."
cd ~/ota-platform/packages/dashboard
npm run build

# 安裝 PM2
echo "[8/8] 安裝 PM2..."
sudo npm install -g pm2 || echo "PM2 already installed"

echo ""
echo "✅ 部署準備完成！"
echo ""
echo "啟動服務："
echo "  cd ~/ota-platform/packages/api && pm2 start dist/server.js --name ota-api"
echo "  cd ~/ota-platform/packages/dashboard && pm2 serve dist 3001 --name ota-dashboard"
echo ""
