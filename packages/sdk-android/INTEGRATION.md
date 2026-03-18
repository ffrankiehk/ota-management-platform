# OTA Platform Android SDK - Integration Guide

Complete guide for integrating OTA Platform SDK into your Android application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Basic Setup](#basic-setup)
4. [Usage Examples](#usage-examples)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

- **Android SDK 21+** (Android 5.0 Lollipop or higher)
- **Kotlin 1.9+** or **Java 8+**
- **AndroidX** libraries
- **Internet permission** in AndroidManifest.xml

## Installation

### Step 1: Add SDK Dependency

Add the OTA Platform SDK to your app's `build.gradle` file:

```kotlin
dependencies {
    implementation("com.otaplatform:sdk-android:1.0.0")
}
```

### Step 2: Add Internet Permission

Add the following permission to your `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

### Step 3: Sync Project

Sync your Gradle files and rebuild the project.

## Basic Setup

### 1. Initialize OTA Client

Create an `OTAConfig` object with your API configuration:

```kotlin
import com.otaplatform.sdk.*

class MyApplication : Application() {
    
    lateinit var otaClient: OTAClient
        private set
    
    override fun onCreate() {
        super.onCreate()
        
        val config = OTAConfig(
            apiBaseUrl = "https://your-ota-api.com",
            bundleId = packageName, // or your custom bundle ID
            platform = "android",
            currentVersion = BuildConfig.VERSION_NAME,
            deviceId = getDeviceId(),
            timeoutSeconds = 30,
            enableLogging = BuildConfig.DEBUG
        )
        
        otaClient = OTAClient(config)
    }
    
    private fun getDeviceId(): String {
        // Generate or retrieve a unique device identifier
        // Use SharedPreferences to persist it
        val prefs = getSharedPreferences("ota_prefs", MODE_PRIVATE)
        var deviceId = prefs.getString("device_id", null)
        
        if (deviceId == null) {
            deviceId = UUID.randomUUID().toString()
            prefs.edit().putString("device_id", deviceId).apply()
        }
        
        return deviceId
    }
}
```

### 2. Declare Application Class

Add your Application class to `AndroidManifest.xml`:

```xml
<application
    android:name=".MyApplication"
    ...>
</application>
```

## Usage Examples

### Example 1: Check for Updates on App Launch

```kotlin
class MainActivity : AppCompatActivity() {
    
    private val otaClient: OTAClient by lazy {
        (application as MyApplication).otaClient
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        // Check for updates when app launches
        lifecycleScope.launch {
            checkForUpdates()
        }
    }
    
    private suspend fun checkForUpdates() {
        otaClient.checkForUpdate(object : UpdateListener {
            override fun onUpdateAvailable(updateInfo: UpdateInfo) {
                showUpdateDialog(updateInfo)
            }
            
            override fun onNoUpdate(currentVersion: String) {
                Log.d("OTA", "App is up to date: $currentVersion")
            }
            
            override fun onError(error: OTAException) {
                Log.e("OTA", "Failed to check for updates", error)
                Toast.makeText(
                    this@MainActivity,
                    "Failed to check for updates",
                    Toast.LENGTH_SHORT
                ).show()
            }
        })
    }
}
```

### Example 2: Show Update Dialog

```kotlin
private fun showUpdateDialog(updateInfo: UpdateInfo) {
    val message = buildString {
        appendLine("A new version ${updateInfo.latestVersion} is available!")
        appendLine()
        if (updateInfo.releaseNotes.isNotBlank()) {
            appendLine("What's new:")
            appendLine(updateInfo.releaseNotes)
            appendLine()
        }
        appendLine("Size: ${formatBytes(updateInfo.bundleSize)}")
    }
    
    AlertDialog.Builder(this)
        .setTitle(if (updateInfo.isMandatory) "Update Required" else "Update Available")
        .setMessage(message)
        .setPositiveButton("Update") { _, _ ->
            downloadAndInstallUpdate(updateInfo)
        }
        .apply {
            if (!updateInfo.isMandatory) {
                setNegativeButton("Later", null)
            } else {
                setCancelable(false)
            }
        }
        .show()
}

private fun formatBytes(bytes: Long): String {
    if (bytes < 1024) return "$bytes B"
    val kb = bytes / 1024.0
    if (kb < 1024) return "%.1f KB".format(kb)
    val mb = kb / 1024.0
    return "%.1f MB".format(mb)
}
```

### Example 3: Download and Install Update

```kotlin
private fun downloadAndInstallUpdate(updateInfo: UpdateInfo) {
    // Show progress dialog
    val progressDialog = ProgressDialog(this).apply {
        setTitle("Downloading Update")
        setMessage("Downloading ${updateInfo.latestVersion}...")
        setProgressStyle(ProgressDialog.STYLE_HORIZONTAL)
        setCancelable(false)
        max = 100
        show()
    }
    
    lifecycleScope.launch {
        val downloadDir = File(cacheDir, "ota_updates")
        
        otaClient.downloadUpdate(
            updateInfo = updateInfo,
            downloadDir = downloadDir,
            listener = object : DownloadListener {
                override fun onProgress(bytesDownloaded: Long, totalBytes: Long) {
                    val progress = ((bytesDownloaded * 100) / totalBytes).toInt()
                    progressDialog.progress = progress
                    progressDialog.setMessage(
                        "Downloading... ${formatBytes(bytesDownloaded)} / ${formatBytes(totalBytes)}"
                    )
                }
                
                override fun onDownloadComplete(filePath: String) {
                    progressDialog.dismiss()
                    verifyAndInstall(filePath, updateInfo)
                }
                
                override fun onError(error: OTAException) {
                    progressDialog.dismiss()
                    showErrorDialog("Download failed: ${error.message}")
                }
            }
        )
    }
}
```

### Example 4: Verify and Install Bundle

```kotlin
private suspend fun verifyAndInstall(filePath: String, updateInfo: UpdateInfo) {
    // Show verification dialog
    val dialog = ProgressDialog(this).apply {
        setMessage("Verifying update...")
        setCancelable(false)
        show()
    }
    
    try {
        // Verify bundle hash
        val isValid = otaClient.verifyBundle(filePath, updateInfo.bundleHash)
        
        dialog.dismiss()
        
        if (isValid) {
            // Install the update (your implementation)
            installUpdate(filePath, updateInfo)
        } else {
            // Report verification failed
            otaClient.reportStatus(
                releaseId = updateInfo.releaseId,
                status = UpdateStatus.FAILED,
                errorMessage = "Bundle hash verification failed"
            )
            
            showErrorDialog("Update verification failed")
        }
    } catch (e: Exception) {
        dialog.dismiss()
        showErrorDialog("Verification error: ${e.message}")
    }
}

private suspend fun installUpdate(filePath: String, updateInfo: UpdateInfo) {
    try {
        // Report verification passed
        otaClient.reportStatus(
            releaseId = updateInfo.releaseId,
            status = UpdateStatus.VERIFIED
        )
        
        // Your update installation logic here
        // For example, for React Native CodePush-style updates:
        // 1. Extract the bundle
        // 2. Copy to app's bundle directory
        // 3. Update preferences with new bundle path
        // 4. Restart app to load new bundle
        
        // Example placeholder:
        performBundleInstallation(filePath)
        
        // Report successful installation
        otaClient.reportStatus(
            releaseId = updateInfo.releaseId,
            status = UpdateStatus.INSTALLED
        )
        
        // Show success and restart app
        showSuccessDialog()
        
    } catch (e: Exception) {
        otaClient.reportStatus(
            releaseId = updateInfo.releaseId,
            status = UpdateStatus.FAILED,
            errorMessage = "Installation failed: ${e.message}"
        )
        
        showErrorDialog("Installation failed: ${e.message}")
    }
}

private fun performBundleInstallation(filePath: String) {
    // Implement your bundle installation logic
    // This depends on your app architecture (React Native, Native, etc.)
}

private fun showSuccessDialog() {
    AlertDialog.Builder(this)
        .setTitle("Update Installed")
        .setMessage("The update has been installed successfully. The app will now restart.")
        .setPositiveButton("Restart") { _, _ ->
            restartApp()
        }
        .setCancelable(false)
        .show()
}

private fun restartApp() {
    val intent = packageManager.getLaunchIntentForPackage(packageName)
    intent?.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NEW_TASK)
    startActivity(intent)
    finish()
    exitProcess(0)
}

private fun showErrorDialog(message: String) {
    AlertDialog.Builder(this)
        .setTitle("Update Error")
        .setMessage(message)
        .setPositiveButton("OK", null)
        .show()
}
```

## Best Practices

### 1. Check for Updates Wisely

- **On app launch**: Check for updates when the app starts
- **On resume**: Check when app returns from background (with throttling)
- **Manual check**: Provide a "Check for Updates" button in settings

```kotlin
private var lastUpdateCheck = 0L
private val UPDATE_CHECK_INTERVAL = 6 * 60 * 60 * 1000 // 6 hours

override fun onResume() {
    super.onResume()
    
    val now = System.currentTimeMillis()
    if (now - lastUpdateCheck > UPDATE_CHECK_INTERVAL) {
        lifecycleScope.launch {
            checkForUpdates()
        }
        lastUpdateCheck = now
    }
}
```

### 2. Handle Mandatory Updates

Always show mandatory updates and prevent users from dismissing them:

```kotlin
if (updateInfo.isMandatory) {
    // Show non-dismissible dialog
    // Block app usage until update is installed
}
```

### 3. Network Error Handling

Handle network errors gracefully:

```kotlin
override fun onError(error: OTAException) {
    when {
        error.message?.contains("timeout", ignoreCase = true) == true -> {
            // Network timeout
        }
        error.message?.contains("No address associated with hostname") == true -> {
            // No internet connection
        }
        else -> {
            // Other errors
        }
    }
}
```

### 4. Background Downloads

For large updates, consider using WorkManager for background downloads:

```kotlin
class UpdateDownloadWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {
    
    override suspend fun doWork(): Result {
        // Download update in background
        return Result.success()
    }
}
```

### 5. Storage Management

Clean up old update files:

```kotlin
private fun cleanupOldUpdates() {
    val updateDir = File(cacheDir, "ota_updates")
    updateDir.listFiles()?.forEach { file ->
        if (file.lastModified() < System.currentTimeMillis() - 7 * 24 * 60 * 60 * 1000) {
            file.delete()
        }
    }
}
```

## Troubleshooting

### Issue: SSL/TLS Errors

If you encounter SSL certificate errors, ensure your API server has a valid SSL certificate. For development/testing with self-signed certificates:

```kotlin
// NOT recommended for production!
val trustAllCerts = TrustManager[] {
    // ... trust all certificates
}
```

### Issue: Network Security Configuration

For Android 9+, you may need to add a network security configuration:

```xml
<!-- res/xml/network_security_config.xml -->
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">your-api-domain.com</domain>
    </domain-config>
</network-security-config>
```

And reference it in AndroidManifest.xml:

```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
</application>
```

### Issue: Coroutines Not Found

Ensure you have kotlinx-coroutines dependency:

```kotlin
dependencies {
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
}
```

## Support

For issues, questions, or contributions, please visit:
- GitHub: https://github.com/your-org/ota-platform
- Documentation: https://docs.ota-platform.com

## License

MIT License
