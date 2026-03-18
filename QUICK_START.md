# OTA Platform - 快速测试指南

## 前置要求

- Node.js >= 18
- PostgreSQL (通过 Docker 或本地安装)
- Redis (通过 Docker 或本地安装)
- MinIO (通过 Docker 或本地安装)

---

## 步骤 1: 安装依赖

```powershell
cd c:\xampp-AMC\htdocs\ota-management-platform
npm install
```

---

## 步骤 2: 配置环境变量

确保 `.env` 文件存在且配置正确：

```bash
# 数据库
DATABASE_URL=postgresql://ota_user:ota_password@localhost:5432/ota_platform

# Redis
REDIS_URL=redis://localhost:6379

# MinIO
STORAGE_TYPE=minio
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123

# API
API_PORT=3000
```

---

## 步骤 3: 启动基础设施服务

**使用 Docker (推荐)**:

```powershell
cd c:\xampp-AMC\htdocs\ota-management-platform
npm run dev:infrastructure
```

这会启动：
- PostgreSQL (端口 5432)
- Redis (端口 6379)
- MinIO (端口 9000, 控制台 9001)

**或手动启动**：自行安装并启动 PostgreSQL、Redis、MinIO

---

## 步骤 4: 运行数据库 Migration

```powershell
cd c:\xampp-AMC\htdocs\ota-management-platform\packages\api
npm run migrate
```

预期输出：
```
✅ 20241218-add-bundle-type-and-signature 已应用
✅ 20241218-create-update-logs 已应用
✅ 20241218-create-rollback-rules 已应用
```

---

## 步骤 5: 启动后端 API

**新开一个 Terminal**:

```powershell
cd c:\xampp-AMC\htdocs\ota-management-platform
npm run dev:api
```

预期输出：
```
🚀 API Server running on http://localhost:3000
```

---

## 步骤 6: 创建测试数据

**新开一个 Terminal**:

```powershell
cd c:\xampp-AMC\htdocs\ota-management-platform
node seed-test-data.js
```

预期输出：
```
✅ 数据库连接成功
✅ Organization 创建成功
✅ Application 创建成功
✅ Release 创建成功
✅ User 创建成功
```

---

## 步骤 7: 运行 API 测试

```powershell
node test-api.js
```

预期输出：
```
🧪 OTA Platform API 测试
==========================================================
1. Health Check
==========================================================
✅ Health check passed

==========================================================
2. Check Update (GET) - 测试修复的 bug
==========================================================
✅ GET check-update 正常工作（bug 已修复）
✅ 发现更新: 1.0.1

==========================================================
3. Check Update (POST) - 向后兼容
==========================================================
✅ POST check-update 也正常工作（向后兼容）

==========================================================
4. Report Status - 新增的状态上报功能
==========================================================
✅ 开始下载 - 上报成功
✅ 下载完成 - 上报成功
✅ Hash 校验通过 - 上报成功
✅ 安装成功 - 上报成功

✅ 所有 Week 1 改动已验证！
```

---

## 验证数据库记录

**查看状态上报记录**:

```sql
-- 连接数据库
psql -U ota_user -d ota_platform

-- 查询上报记录
SELECT 
  device_id,
  status,
  download_time_ms,
  install_time_ms,
  created_at
FROM update_logs
ORDER BY created_at DESC
LIMIT 10;
```

---

## 常见问题

### 1. 数据库连接失败

**错误**: `connect ECONNREFUSED 127.0.0.1:5432`

**解决**:
```powershell
# 检查 Docker 服务是否运行
docker ps

# 重启基础设施
npm run docker:down
npm run dev:infrastructure
```

### 2. Migration 失败

**错误**: `relation "releases" does not exist`

**解决**:
```powershell
# 重置数据库
npm run docker:down
npm run dev:infrastructure
cd packages/api
npm run migrate
```

### 3. API 404 错误

**错误**: `Application not found`

**解决**:
```powershell
# 重新创建测试数据
node seed-test-data.js
```

---

## 下一步

测试通过后，可以：

1. **启动 Dashboard** (可选):
   ```powershell
   npm run dev:dashboard
   ```
   访问: http://localhost:3001
   登录: test@example.com / test123456

2. **开始 Week 2 开发**:
   - Android Native SDK
   - iOS Native SDK
   - 签名校验机制

3. **配置生产环境**:
   - 修改 `.env.production`
   - 配置真实的 S3/MinIO
   - 设置 JWT secret
