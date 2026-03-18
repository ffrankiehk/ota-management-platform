# OTA Test App - Android 测试应用

这是一个完整的 Android 测试应用，用于在真机上测试 OTA 功能。

## 📱 功能特性

- ✅ 检查更新
- ✅ 下载更新（带进度条）
- ✅ SHA256 校验
- ✅ 状态上报（started/downloaded/verified/installed）
- ✅ 完整的 UI 界面
- ✅ 集成 OTA SDK

## 🛠️ 构建要求

- Android Studio Arctic Fox (2020.3.1) 或更高版本
- JDK 17
- Android SDK API 34
- Gradle 8.0+

## 📦 打包 APK

### 方法 1: 使用 Android Studio（推荐）

1. 用 Android Studio 打开 `test-app-android` 文件夹
2. 等待 Gradle 同步完成
3. 点击 **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
4. APK 文件位置：`app/build/outputs/apk/debug/app-debug.apk`

### 方法 2: 使用命令行

```bash
cd test-app-android

# Windows
gradlew.bat assembleDebug

# macOS/Linux
./gradlew assembleDebug
```

APK 输出位置：`app/build/outputs/apk/debug/app-debug.apk`

## 📲 安装到真机

### 方法 1: 使用 ADB

```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

### 方法 2: 直接传输

1. 将 APK 文件复制到手机
2. 在手机上打开文件管理器
3. 点击 APK 文件安装（需要允许安装未知来源应用）

## ⚙️ 配置 API 地址

在真机测试前，需要修改 API 地址：

### 1. 找到你的电脑 IP 地址

**Windows:**
```bash
ipconfig
# 查找 IPv4 地址，例如: 192.168.1.100
```

**macOS/Linux:**
```bash
ifconfig
# 或
ip addr show
```

### 2. 修改代码中的 API 地址

打开 `app/src/main/java/com/otaplatform/testapp/MainActivity.kt`

找到第 25-27 行：
```kotlin
val config = OTAConfig(
    apiBaseUrl = "http://10.0.2.2:3000", // 模拟器
    // apiBaseUrl = "http://YOUR_IP:3000", // 真机
```

修改为你的电脑 IP：
```kotlin
val config = OTAConfig(
    apiBaseUrl = "http://192.168.1.100:3000", // 替换为你的 IP
```

### 3. 重新构建 APK

修改后重新执行打包步骤。

## 🚀 使用步骤

### 1. 启动后端服务

```bash
# 在项目根目录
cd packages/api
npm run dev
```

确保后端在 `http://localhost:3000` 运行。

### 2. 创建测试应用和发布

在 Dashboard (http://localhost:5173) 中：

1. 创建应用：
   - Bundle ID: `com.otaplatform.testapp`
   - Platform: `android`
   - Name: `OTA Test App`

2. 创建发布：
   - Version: `1.0.1`
   - 上传 Bundle 文件（任意 ZIP 文件用于测试）
   - Release Notes: `测试更新`
   - Status: `active`

### 3. 在手机上测试

1. 打开 OTA Test App
2. 查看当前版本：`1.0.0`
3. 点击"检查更新"按钮
4. 如果发现更新，点击"下载更新"
5. 等待下载完成
6. 查看安装对话框

## 📊 测试结果查看

### Dashboard 中查看

1. **Devices 页面**：查看测试设备是否自动创建
2. **Update Logs 页面**：查看完整的更新日志
   - started
   - downloaded
   - verified
   - installed

### 日志查看

在 Android Studio 的 Logcat 中过滤 `OTA`：

```
[OTA] Checking for update...
[OTA] Update available: 1.0.1
[OTA] Downloading: 0%
[OTA] Downloading: 50%
[OTA] Downloading: 100%
[OTA] Verifying bundle...
[OTA] Verification: PASSED
```

## 🐛 故障排除

### 1. 连接失败

**症状**: `Check update failed: Failed to connect`

**解决**:
- 确保手机和电脑在同一 Wi-Fi 网络
- 检查防火墙是否允许 3000 端口
- 确认 API 地址是否正确

### 2. 无法安装 APK

**症状**: 安装被阻止

**解决**:
- 在手机设置中允许安装未知来源应用
- Android 8.0+: 设置 → 安全 → 未知来源 → 允许此来源

### 3. 已是最新版本

**症状**: 点击检查更新显示"已是最新版本"

**解决**:
- 确认 Dashboard 中已创建版本 `1.0.1` 的发布
- 确认发布状态为 `active`
- 确认 Bundle ID 和 Platform 匹配

### 4. 下载失败

**症状**: 下载进度卡住或失败

**解决**:
- 检查网络连接
- 确认 Bundle URL 可访问
- 查看后端日志是否有错误

## 📂 项目结构

```
test-app-android/
├── app/
│   ├── src/main/
│   │   ├── java/com/otaplatform/testapp/
│   │   │   ├── MainActivity.kt          # 主界面
│   │   │   └── ota/                     # OTA SDK
│   │   │       ├── OTAClient.kt
│   │   │       ├── OTAConfig.kt
│   │   │       ├── UpdateInfo.kt
│   │   │       └── ...
│   │   ├── res/
│   │   │   ├── layout/
│   │   │   │   └── activity_main.xml    # UI 布局
│   │   │   └── values/
│   │   │       ├── strings.xml
│   │   │       └── themes.xml
│   │   └── AndroidManifest.xml
│   └── build.gradle                      # App 构建配置
├── build.gradle                          # 项目构建配置
├── settings.gradle
└── README.md
```

## 🎯 测试场景

### 场景 1: 正常更新流程

1. 检查更新 → 发现 1.0.1
2. 下载更新 → 进度 0-100%
3. 校验成功
4. 模拟安装

### 场景 2: 强制更新

在 Dashboard 中将发布设为 `Mandatory`，测试强制更新逻辑。

### 场景 3: 灰度发布

1. 设置 `Rollout Percentage` 为 10%
2. 多个设备测试，观察哪些设备能收到更新

## 📝 版本信息

- **App Version**: 1.0.0
- **Target SDK**: 34 (Android 14)
- **Min SDK**: 21 (Android 5.0)
- **Build Tools**: 34.0.0

## 📄 许可证

MIT License

---

## 🔗 相关文档

- [OTA Platform 完整指南](../COMPLETE_GUIDE.md)
- [Android SDK 文档](../packages/sdk-android/README.md)
- [项目总结](../FINAL_SUMMARY.md)
