# OTA Platform 完整使用指南

这是一个完整的 Over-the-Air (OTA) 更新管理平台，包含后端 API、管理后台 Dashboard 和 Android SDK。

## 📚 目录

1. [系统架构](#系统架构)
2. [快速开始](#快速开始)
3. [开发者指南](#开发者指南)
4. [部署指南](#部署指南)
5. [使用流程](#使用流程)
6. [API 文档](#api-文档)
7. [常见问题](#常见问题)

---

## 系统架构

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    OTA Management Platform                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Dashboard  │  │   API Server │  │   Database   │      │
│  │   (React)    │──│   (Node.js)  │──│ (PostgreSQL) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                                 │
│         │                  │                                 │
│         └──────────────────┴─────────────────┐              │
│                                               │              │
└───────────────────────────────────────────────┼──────────────┘
                                                │
                        ┌───────────────────────┴──────────────┐
                        │                                       │
                ┌───────▼──────┐                       ┌───────▼──────┐
                │ Android App  │                       │   iOS App    │
                │  (SDK集成)   │                       │  (未来支持)  │
                └──────────────┘                       └──────────────┘
```

### 核心组件

1. **API Server** (`packages/api/`)
   - Node.js + Express + TypeScript
   - OTA API（check-update, report-status）
   - Admin API（应用/版本/设备/日志管理）
   - 自动 Device upsert
   - 数据库索引优化

2. **Dashboard** (`packages/dashboard/`)
   - React + TypeScript + Ant Design
   - 应用管理（创建/编辑/删除）
   - 版本发布管理（上传 bundle、配置灰度发布）
   - 设备监控（查看设备列表、最新更新状态）
   - 更新日志（查看所有更新记录）
   - 数据统计（总览仪表板）

3. **Android SDK** (`packages/sdk-android/`)
   - Kotlin + OkHttp + Gson
   - 检查更新
   - 下载更新包（带进度）
   - SHA256 完整性校验
   - 状态上报
   - 自动 Device 创建

4. **Database**
   - PostgreSQL
   - 表：users, organizations, applications, releases, devices, update_logs
   - 索引优化：device_id 索引

---

## 快速开始

### 前置要求

- **Node.js** 18+
- **PostgreSQL** 14+
- **npm** 或 **yarn**

### 1. 克隆项目

```bash
git clone <repository-url>
cd ota-management-platform
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 到 `.env` 并配置：

```env
# Database
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/ota_platform

# API
NODE_ENV=development
PORT=3000
JWT_SECRET=your-secret-key-change-in-production

# Dashboard
VITE_API_URL=http://localhost:3000
```

### 4. 初始化数据库

```bash
# 在 packages/api 目录下
cd packages/api
npm run migrate
```

### 5. 创建管理员账号

```bash
# 在项目根目录
node create-admin.js
```

默认账号：
- 邮箱：`admin@example.com`
- 密码：`admin123`

### 6. 启动服务

```bash
# 启动 API Server
cd packages/api
npm run dev

# 新终端：启动 Dashboard
cd packages/dashboard
npm run dev
```

### 7. 访问 Dashboard

打开浏览器访问：http://localhost:5173

使用上面的管理员账号登录。

---

## 开发者指南

### 项目结构

```
ota-management-platform/
├── packages/
│   ├── api/                    # 后端 API
│   │   ├── src/
│   │   │   ├── controllers/    # 控制器
│   │   │   ├── models/         # 数据模型
│   │   │   ├── routes/         # 路由
│   │   │   ├── middleware/     # 中间件
│   │   │   └── migrations/     # 数据库迁移
│   │   └── .env
│   ├── dashboard/              # 管理后台
│   │   ├── src/
│   │   │   ├── pages/          # 页面组件
│   │   │   ├── components/     # 公共组件
│   │   │   ├── contexts/       # React Context
│   │   │   └── config/         # 配置
│   │   └── .env
│   └── sdk-android/            # Android SDK
│       ├── src/main/java/com/otaplatform/sdk/
│       ├── build.gradle.kts
│       ├── README.md
│       ├── INTEGRATION.md
│       └── API.md
├── test-api.js                 # API 测试脚本
├── test-android-sdk-integration.js  # SDK 集成测试
├── seed-test-data.js           # 测试数据种子
└── README.md
```

### 本地开发流程

1. **创建应用**
   - 登录 Dashboard
   - 进入"Applications"页面
   - 点击"Create Application"
   - 填写应用信息（Name、Bundle ID、Platform）

2. **发布版本**
   - 点击应用名称进入详情页
   - 点击"Create Release"
   - 上传 bundle 文件（或手动填写 URL/Hash/Size）
   - 填写版本号、Release Notes
   - 配置是否强制更新、灰度百分比
   - 设置状态为"Active"

3. **测试 OTA 流程**
   ```bash
   # 运行测试脚本
   node test-api.js
   
   # 或运行 Android SDK 集成测试
   node test-android-sdk-integration.js
   ```

4. **查看数据**
   - **Devices**: 查看已连接的设备
   - **Update Logs**: 查看所有更新记录
   - **Overview**: 查看统计数据

### API 开发

#### 添加新的 API 端点

1. 创建 Controller (`packages/api/src/controllers/`)
2. 定义 Route (`packages/api/src/routes/`)
3. 在 `app.ts` 中注册路由
4. 添加 TypeScript 类型定义

#### 数据库 Migration

```bash
# 创建新 migration
cd packages/api
npx sequelize-cli migration:generate --name your-migration-name

# 运行 migration
npm run migrate

# 回滚 migration
npx sequelize-cli db:migrate:undo
```

### Dashboard 开发

#### 添加新页面

1. 创建页面组件 (`packages/dashboard/src/pages/`)
2. 在 `App.tsx` 中添加路由
3. 在侧边栏导航中添加菜单项（如需要）

#### API 调用

使用配置好的 axios 实例：

```typescript
import { api } from '../../config/api';

const response = await api.get('/api/v1/admin/applications');
```

### Android SDK 开发

详细文档见：
- `packages/sdk-android/README.md` - 快速开始
- `packages/sdk-android/INTEGRATION.md` - 集成指南
- `packages/sdk-android/API.md` - API 参考

---

## 部署指南

### 使用 Docker Compose（推荐）

1. **配置环境变量**

创建 `.env.production`:

```env
DATABASE_URL=postgresql://postgres:production_password@db:5432/ota_platform
NODE_ENV=production
JWT_SECRET=change-this-to-a-secure-random-string
PORT=3000
VITE_API_URL=https://your-domain.com
```

2. **启动服务**

```bash
docker-compose -f docker-compose.prod.yml up -d
```

3. **初始化数据库**

```bash
docker-compose exec api npm run migrate
```

4. **创建管理员**

```bash
docker-compose exec api node /app/create-admin.js
```

### 手动部署

#### 1. 部署数据库

安装并配置 PostgreSQL：

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql

# 创建数据库
sudo -u postgres createdb ota_platform
```

#### 2. 部署 API Server

```bash
cd packages/api

# 安装依赖
npm ci --production

# 运行 migration
npm run migrate

# 使用 PM2 启动
npm install -g pm2
pm2 start dist/index.js --name ota-api
pm2 save
pm2 startup
```

#### 3. 部署 Dashboard

```bash
cd packages/dashboard

# 构建生产版本
npm run build

# 使用 Nginx 托管
sudo cp -r dist/* /var/www/ota-dashboard/
```

**Nginx 配置示例**:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Dashboard
    location / {
        root /var/www/ota-dashboard;
        try_files $uri $uri/ /index.html;
    }

    # API Proxy
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 使用流程

### 完整 OTA 流程

1. **管理员发布新版本**
   - 登录 Dashboard
   - 进入 Applications → 选择应用 → Create Release
   - 上传新版本 bundle
   - 配置版本信息和发布策略
   - 激活发布（状态改为 Active）

2. **App 检查更新**
   - Android App 启动时调用 `OTAClient.checkForUpdate()`
   - SDK 调用 `GET /api/v1/ota/check-update`
   - 服务器返回最新版本信息
   - 如果有更新，显示更新对话框

3. **下载更新**
   - 用户确认更新
   - SDK 调用 `OTAClient.downloadUpdate()`
   - 显示下载进度
   - SDK 自动上报状态：STARTED → DOWNLOADED

4. **校验更新**
   - SDK 调用 `OTAClient.verifyBundle()`
   - 使用 SHA256 校验文件完整性
   - SDK 上报状态：VERIFIED

5. **安装更新**
   - App 安装新 bundle
   - SDK 上报状态：INSTALLED
   - App 重启加载新版本

6. **监控与统计**
   - Dashboard 实时显示设备列表和更新状态
   - Update Logs 记录所有更新过程
   - Overview 显示统计数据（成功率、设备数等）

### 灰度发布

1. 创建 Release 时设置 `rolloutPercentage` 为 0-100
2. 例如：设置为 20%，表示只有 20% 的设备会收到更新
3. 观察更新效果后，逐步提升百分比
4. 最终设置为 100% 全量发布

### 强制更新

1. 创建 Release 时勾选 `Mandatory Update`
2. App 检测到强制更新时，不允许用户关闭更新对话框
3. 用户必须安装更新才能继续使用 App

---

## API 文档

### OTA API（供 SDK 调用）

#### 1. Check Update

**Endpoint:** `GET /api/v1/ota/check-update`

**Query Parameters:**
- `bundleId` (string, required): 应用 Bundle ID
- `platform` (string, required): 平台（android/ios）
- `currentVersion` (string, required): 当前版本
- `deviceId` (string, optional): 设备 ID

**Response:**
```json
{
  "success": true,
  "data": {
    "updateAvailable": true,
    "currentVersion": "1.0.0",
    "latestVersion": "1.0.1",
    "releaseId": "uuid",
    "downloadUrl": "https://...",
    "bundleHash": "sha256...",
    "bundleSize": 1234567,
    "releaseNotes": "修复了若干 bug",
    "isMandatory": false,
    "minAppVersion": null
  }
}
```

#### 2. Report Status

**Endpoint:** `POST /api/v1/ota/report-status`

**Request Body:**
```json
{
  "deviceId": "device-001",
  "releaseId": "uuid",
  "status": "installed",
  "errorMessage": null,
  "downloadTimeMs": 1500,
  "installTimeMs": 800,
  "deviceInfo": {
    "manufacturer": "Google",
    "model": "Pixel 7",
    "osVersion": "14",
    "appVersion": "1.0.1"
  }
}
```

**Status Values:**
- `started` - 开始下载
- `downloaded` - 下载完成
- `verified` - 校验通过
- `installed` - 安装成功
- `failed` - 失败

### Admin API（供 Dashboard 调用）

详细 API 文档见各 Controller 文件的注释。

主要端点：
- `GET /api/v1/admin/overview` - 统计数据
- `GET /api/v1/admin/applications` - 应用列表
- `POST /api/v1/admin/applications` - 创建应用
- `GET /api/v1/admin/applications/:id` - 应用详情
- `POST /api/v1/admin/applications/:id/releases` - 创建版本
- `GET /api/v1/admin/devices` - 设备列表
- `GET /api/v1/admin/update-logs` - 更新日志

---

## 常见问题

### Q: 如何重置管理员密码？

运行脚本：
```bash
node create-admin.js
```

### Q: Dashboard 无法连接 API？

检查：
1. API Server 是否启动（http://localhost:3000/health）
2. Dashboard `.env` 中的 `VITE_API_URL` 是否正确
3. CORS 配置是否包含 Dashboard 的域名

### Q: Android SDK 报错 "HTTP 404"？

检查：
1. `apiBaseUrl` 配置是否正确
2. API Server 是否正常运行
3. Bundle ID 是否存在于数据库

### Q: 更新日志为空？

确认：
1. 已经运行过 `test-api.js` 或实际设备调用了 OTA API
2. Device 记录已创建（检查 Devices 页面）
3. Release 状态为 "Active"

### Q: 如何清空测试数据？

```bash
# 重置数据库
cd packages/api
npx sequelize-cli db:migrate:undo:all
npm run migrate

# 重新创建管理员
node ../../create-admin.js
```

### Q: 生产环境如何配置 HTTPS？

使用 Nginx 反向代理：
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
    }
}
```

---

## 下一步

1. ✅ **已完成**: Week 1 后端 + Dashboard + Week 2 Android SDK
2. 🔄 **可选**: 
   - 创建 Android 示例应用
   - 开发 iOS SDK
   - 添加更多监控指标
   - 实现自动回滚功能
3. 📚 **学习资源**:
   - Android SDK 集成指南: `packages/sdk-android/INTEGRATION.md`
   - API 参考文档: `packages/sdk-android/API.md`

---

## 支持

如有问题，请查阅：
- 本文档
- 各子项目的 README
- 代码注释

---

**版本**: 1.0.0  
**最后更新**: 2025-12-18  
**许可证**: MIT
