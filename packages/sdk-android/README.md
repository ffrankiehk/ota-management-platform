# OTA Platform Android SDK

Android SDK for OTA Platform - Over-the-Air update management for Android applications.

## Features

- ✅ Check for updates from OTA Platform API
- ✅ Download update bundles with progress tracking
- ✅ SHA256 integrity verification
- ✅ Status reporting (started, downloaded, verified, installed, failed)
- ✅ Automatic rollback support
- ✅ Kotlin Coroutines support
- ✅ Minimal dependencies (OkHttp + Gson)

## Requirements

- Android SDK 21+ (Android 5.0+)
- Kotlin 1.9+
- AndroidX

## Installation

### Gradle (Kotlin DSL)

```kotlin
dependencies {
    implementation("com.otaplatform:sdk-android:1.0.0")
}
```

### Gradle (Groovy)

```groovy
dependencies {
    implementation 'com.otaplatform:sdk-android:1.0.0'
}
```

## Quick Start

### 1. Initialize OTA Client

```kotlin
val config = OTAConfig(
    apiBaseUrl = "https://your-ota-api.com",
    bundleId = "com.example.myapp",
    platform = "android",
    currentVersion = BuildConfig.VERSION_NAME,
    deviceId = getDeviceId() // Your device identifier
)

val otaClient = OTAClient(config)
```

### 2. Check for Updates

```kotlin
lifecycleScope.launch {
    otaClient.checkForUpdate(object : UpdateListener {
        override fun onUpdateAvailable(updateInfo: UpdateInfo) {
            // Update is available
            Log.d("OTA", "New version: ${updateInfo.latestVersion}")
            
            if (updateInfo.isMandatory) {
                // Force update
                downloadAndInstall(updateInfo)
            } else {
                // Show update dialog to user
                showUpdateDialog(updateInfo)
            }
        }
        
        override fun onNoUpdate(currentVersion: String) {
            Log.d("OTA", "Already on latest version: $currentVersion")
        }
        
        override fun onError(error: OTAException) {
            Log.e("OTA", "Check update failed", error)
        }
    })
}
```

### 3. Download and Install Update

```kotlin
lifecycleScope.launch {
    otaClient.downloadUpdate(
        updateInfo = updateInfo,
        listener = object : DownloadListener {
            override fun onProgress(bytesDownloaded: Long, totalBytes: Long) {
                val progress = (bytesDownloaded * 100 / totalBytes).toInt()
                updateProgressBar(progress)
            }
            
            override fun onDownloadComplete(filePath: String) {
                Log.d("OTA", "Download complete: $filePath")
                // Verify and install
                verifyAndInstall(filePath, updateInfo)
            }
            
            override fun onError(error: OTAException) {
                Log.e("OTA", "Download failed", error)
            }
        }
    )
}
```

### 4. Verify and Install

```kotlin
suspend fun verifyAndInstall(filePath: String, updateInfo: UpdateInfo) {
    // Verify bundle hash
    val isValid = otaClient.verifyBundle(filePath, updateInfo.bundleHash)
    
    if (isValid) {
        // Install update (your implementation)
        installBundle(filePath)
        
        // Report success
        otaClient.reportStatus(
            releaseId = updateInfo.releaseId,
            status = UpdateStatus.INSTALLED
        )
    } else {
        // Report verification failed
        otaClient.reportStatus(
            releaseId = updateInfo.releaseId,
            status = UpdateStatus.FAILED,
            errorMessage = "Bundle hash verification failed"
        )
    }
}
```

## API Reference

See [API.md](./API.md) for complete API documentation.

## License

MIT License
