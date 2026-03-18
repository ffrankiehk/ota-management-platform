# 📦 Android APK 打包指南

## 🎯 推荐方法：使用 Android Studio

### 步骤 1: 安装 Android Studio

如果还没安装，请先下载：
- 官网：https://developer.android.com/studio
- 下载 Android Studio（最新版本）
- 安装时选择标准安装，包含 Android SDK

### 步骤 2: 打开项目

1. 启动 Android Studio
2. 点击 **File** → **Open**
3. 选择文件夹：`c:\xampp-AMC\htdocs\ota-management-platform\test-app-android`
4. 点击 **OK**

### 步骤 3: 等待 Gradle 同步

- 第一次打开会自动下载依赖和 Gradle
- 看到底部状态栏显示 "Build Successful"
- 这个过程可能需要 5-10 分钟（取决于网速）

### 步骤 4: 修改 API 地址（重要！）

**真机测试必须修改！**

1. 
   ```
   app → java → com.otaplatform.testapp → MainActivity
   ```

2. `MainActivity.kt`

3. 28-29 行，找到 API 配置：
   ```kotlin
   val config = OTAConfig(
       apiBaseUrl = "http://34.143.178.171:3000", // VM 服务器地址
   ```

4. **无需修改**：已配置为 VM 服务器地址 `34.143.178.171:3000`

5. 保存文件（Ctrl + S）

### 5: APK

1. **Build** **Build Bundle(s) / APK(s)** **Build APK(s)**
2. 1-3 
3. **APK(s) generated successfully**
4. **locate**
1. 点击顶部菜单：**Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. 等待构建完成（1-3 分钟）
3. 看到右下角通知：**APK(s) generated successfully**
4. 点击通知中的 **locate** 链接

### 步骤 6: 获取 APK

APK 文件位置：
```
test-app-android\app\build\outputs\apk\debug\app-debug.apk
```

文件大小约 5-8 MB。

---

## 📲 安装到手机

### 方法 A: 使用 USB 连接

1. 手机开启 **开发者选项** 和 **USB 调试**
2. 用 USB 线连接手机和电脑
3. 在 Android Studio 中点击绿色播放按钮 ▶️
4. 选择你的设备
5. 应用自动安装并启动

### 方法 B: 直接传输 APK

1. 将 `app-debug.apk` 复制到手机（通过 USB、微信、网盘等）
2. 在手机上找到 APK 文件
3. 点击安装
4. 允许安装未知来源应用（如果提示）

---

## ⚙️ 使用前准备

### 1. 启动后端服务

打开新的 CMD 窗口：
```bash
cd c:\xampp-AMC\htdocs\ota-management-platform\packages\api
npm run dev
```

确保显示：
```
✅ Server is running on http://localhost:3000
✅ Database connected
```

### 2. 启动 Dashboard

打开另一个 CMD 窗口：
```bash
cd c:\xampp-AMC\htdocs\ota-management-platform\packages\dashboard
npm run dev
```

访问：http://localhost:5173

### 3. 创建测试数据

在 Dashboard 中：

**创建应用**：
- Bundle ID: `com.otaplatform.testapp`
- Platform: `android`
- Name: `OTA Test App`
- Status: Active

**创建发布**：
- Version: `1.0.1`（App 当前是 1.0.0）
- Upload Bundle: 上传任意 ZIP 文件
- Release Notes: `测试更新：修复 bug`
- Is Mandatory: 可选
- Rollout Percentage: 100
- Status: `active`

---

## 🧪 开始测试

### 1. 打开 App

在手机上启动 **OTA Test App**

### 2. 检查信息

查看界面显示：
- 当前版本: 1.0.0
- 设备 ID: android-xxxxx

### 3. 检查更新

点击 **"检查更新"** 按钮

**成功情况**：
- 显示卡片："发现新版本"
- 最新版本: 1.0.1
- 大小、更新说明等信息

**失败情况**：
- "已是最新版本" - 检查 Dashboard 是否创建了 1.0.1 发布
- "连接失败" - 检查网络、IP 地址、后端是否运行

### 4. 下载更新

点击 **"下载更新"** 按钮

观察：
- 进度条从 0% → 100%
- "下载进度: XX%"
- 下载完成后显示 "正在校验..."

### 5. 安装确认

弹出对话框：**"更新已就绪"**
- 点击 **"确定"**
- 提示 "已模拟安装成功"

---

## 📊 验证结果

### Dashboard - Devices 页面

应该看到：
- Device ID: android-xxxxx
- Platform: android
- App Version: 1.0.0
- Last Check: 刚刚

### Dashboard - Update Logs 页面

应该有 4 条记录：
1. ✅ Status: started
2. ✅ Status: downloaded
3. ✅ Status: verified
4. ✅ Status: installed

---

## 🐛 常见问题

### 问题 1: Gradle 同步失败

**症状**: "Failed to sync Gradle project"

**解决**:
- 确保网络连接正常
- Tools → SDK Manager → 检查 SDK 是否下载
- File → Invalidate Caches → Restart

### 问题 2: 构建失败

**症状**: "Build failed with an exception"

**解决**:
- 查看 Build 窗口的错误信息
- 确保 JDK 版本是 17
- File → Project Structure → 检查 SDK 版本

### 问题 3: 手机连接不上

**症状**: 检查更新显示 "连接失败"

**解决**:
- 确保手机能访问 VM 服务器（34.143.178.171）
- 检查 VM 防火墙是否允许 3000 端口
- 在手机浏览器访问 `http://34.143.178.171:3000/api/v1/ota/health`
- 如果能访问说明网络正常

### 问题 4: 已是最新版本

**症状**: 点检查更新显示 "已是最新版本"

**解决**:
- 检查 Dashboard 中是否创建了版本 `1.0.1`
- 检查 Release Status 是否为 `active`
- 检查 Bundle ID 是否匹配：`com.otaplatform.testapp`
- 检查 Platform 是否为 `android`

### 问题 5: 无法安装 APK

**症状**: 手机阻止安装

**解决**:
- 设置 → 安全 → 允许安装未知来源应用
- Android 8.0+: 需要针对特定来源（如文件管理器）允许

---

## 📝 快速检查清单

安装前：
- [ ] Android Studio 已安装
- [ ] JDK 17 已安装

构建前：
- [ ] 项目在 Android Studio 中打开
- [ ] Gradle 同步成功
- [ ] 修改了 MainActivity 中的 API 地址
- [ ] 获取了电脑的 IPv4 地址

测试前：
- [ ] 后端 API 在 VM 运行中（http://34.143.178.171:3000）
- [ ] Dashboard 运行中（http://34.143.178.171:3001）
- [ ] 创建了应用（com.otaplatform.testapp）
- [ ] 创建了发布（1.0.1, active）
- [ ] 手机能访问 VM 服务器

测试中：
- [ ] APK 安装成功
- [ ] App 启动正常
- [ ] 显示当前版本 1.0.0
- [ ] 点击检查更新
- [ ] 发现新版本 1.0.1
- [ ] 下载进度正常
- [ ] 校验成功
- [ ] Dashboard 中有日志记录

---

## 🎉 成功标志

如果看到以下情况，说明测试成功：

✅ App 显示"发现新版本: 1.0.1"  
✅ 下载进度从 0% 到 100%  
✅ 显示"更新已就绪"对话框  
✅ Dashboard Devices 中出现设备记录  
✅ Dashboard Update Logs 中有 4 条状态记录  

---

## 📞 需要帮助？

查看详细文档：
- [完整指南](../COMPLETE_GUIDE.md)
- [Android SDK 文档](../packages/sdk-android/README.md)
- [项目总结](../FINAL_SUMMARY.md)
