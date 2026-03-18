# OTA Platform Android SDK - API Reference

Complete API documentation for the OTA Platform Android SDK.

## Table of Contents

- [OTAConfig](#otaconfig)
- [OTAClient](#otaclient)
- [UpdateInfo](#updateinfo)
- [UpdateStatus](#updatestatus)
- [UpdateListener](#updatelistener)
- [DownloadListener](#downloadlistener)
- [OTAException](#otaexception)

---

## OTAConfig

Configuration object for initializing the OTA Client.

### Constructor

```kotlin
data class OTAConfig(
    val apiBaseUrl: String,
    val bundleId: String,
    val platform: String = "android",
    val currentVersion: String,
    val deviceId: String,
    val timeoutSeconds: Int = 30,
    val enableLogging: Boolean = false
)
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `apiBaseUrl` | String | Yes | - | Base URL of the OTA Platform API (e.g., "https://api.example.com") |
| `bundleId` | String | Yes | - | Application bundle identifier (e.g., "com.example.myapp") |
| `platform` | String | No | "android" | Platform identifier |
| `currentVersion` | String | Yes | - | Current app version (e.g., BuildConfig.VERSION_NAME) |
| `deviceId` | String | Yes | - | Unique device identifier |
| `timeoutSeconds` | Int | No | 30 | Network request timeout in seconds |
| `enableLogging` | Boolean | No | false | Enable debug logging |

### Example

```kotlin
val config = OTAConfig(
    apiBaseUrl = "https://ota-api.myapp.com",
    bundleId = "com.mycompany.myapp",
    currentVersion = "1.2.0",
    deviceId = "unique-device-id-12345",
    enableLogging = BuildConfig.DEBUG
)
```

---

## OTAClient

Main client class for interacting with the OTA Platform.

### Constructor

```kotlin
class OTAClient(private val config: OTAConfig)
```

### Methods

#### checkForUpdate

Check if an update is available for the current app version.

```kotlin
suspend fun checkForUpdate(listener: UpdateListener)
```

**Parameters:**
- `listener: UpdateListener` - Callback for update check results

**Callbacks:**
- `onUpdateAvailable(updateInfo: UpdateInfo)` - Called when an update is available
- `onNoUpdate(currentVersion: String)` - Called when no update is available
- `onError(error: OTAException)` - Called when an error occurs

**Example:**

```kotlin
lifecycleScope.launch {
    otaClient.checkForUpdate(object : UpdateListener {
        override fun onUpdateAvailable(updateInfo: UpdateInfo) {
            // Handle update available
        }
        
        override fun onNoUpdate(currentVersion: String) {
            // Handle no update
        }
        
        override fun onError(error: OTAException) {
            // Handle error
        }
    })
}
```

#### downloadUpdate

Download an update bundle.

```kotlin
suspend fun downloadUpdate(
    updateInfo: UpdateInfo,
    downloadDir: File,
    listener: DownloadListener
)
```

**Parameters:**
- `updateInfo: UpdateInfo` - Update information from checkForUpdate
- `downloadDir: File` - Directory to save the downloaded file
- `listener: DownloadListener` - Callback for download progress

**Callbacks:**
- `onProgress(bytesDownloaded: Long, totalBytes: Long)` - Called periodically with progress
- `onDownloadComplete(filePath: String)` - Called when download completes
- `onError(error: OTAException)` - Called when an error occurs

**Example:**

```kotlin
val downloadDir = File(context.cacheDir, "ota_updates")

lifecycleScope.launch {
    otaClient.downloadUpdate(
        updateInfo = updateInfo,
        downloadDir = downloadDir,
        listener = object : DownloadListener {
            override fun onProgress(bytesDownloaded: Long, totalBytes: Long) {
                val progress = (bytesDownloaded * 100 / totalBytes).toInt()
                updateProgressBar(progress)
            }
            
            override fun onDownloadComplete(filePath: String) {
                // Verify and install
            }
            
            override fun onError(error: OTAException) {
                // Handle error
            }
        }
    )
}
```

#### verifyBundle

Verify the integrity of a downloaded bundle using SHA256 hash.

```kotlin
suspend fun verifyBundle(filePath: String, expectedHash: String): Boolean
```

**Parameters:**
- `filePath: String` - Path to the downloaded bundle file
- `expectedHash: String` - Expected SHA256 hash from UpdateInfo

**Returns:**
- `Boolean` - true if hash matches, false otherwise

**Example:**

```kotlin
val isValid = otaClient.verifyBundle(
    filePath = "/path/to/bundle.zip",
    expectedHash = updateInfo.bundleHash
)

if (isValid) {
    // Proceed with installation
} else {
    // Handle verification failure
}
```

#### reportStatus

Report update status to the server.

```kotlin
suspend fun reportStatus(
    releaseId: String,
    status: UpdateStatus,
    errorMessage: String? = null,
    downloadTimeMs: Long? = null,
    installTimeMs: Long? = null
)
```

**Parameters:**
- `releaseId: String` - Release ID from UpdateInfo
- `status: UpdateStatus` - Current update status
- `errorMessage: String?` - Optional error message (for FAILED status)
- `downloadTimeMs: Long?` - Optional download duration in milliseconds
- `installTimeMs: Long?` - Optional installation duration in milliseconds

**Example:**

```kotlin
// Report download started
otaClient.reportStatus(
    releaseId = updateInfo.releaseId,
    status = UpdateStatus.STARTED
)

// Report installation successful
otaClient.reportStatus(
    releaseId = updateInfo.releaseId,
    status = UpdateStatus.INSTALLED
)

// Report failure
otaClient.reportStatus(
    releaseId = updateInfo.releaseId,
    status = UpdateStatus.FAILED,
    errorMessage = "Installation failed due to insufficient storage"
)
```

---

## UpdateInfo

Contains information about an available update.

### Data Class

```kotlin
data class UpdateInfo(
    val updateAvailable: Boolean,
    val currentVersion: String,
    val latestVersion: String,
    val releaseId: String,
    val downloadUrl: String,
    val bundleHash: String,
    val bundleSize: Long,
    val releaseNotes: String,
    val isMandatory: Boolean,
    val minAppVersion: String?
)
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `updateAvailable` | Boolean | Whether an update is available |
| `currentVersion` | String | Current installed version |
| `latestVersion` | String | Latest available version |
| `releaseId` | String | Unique release identifier (UUID) |
| `downloadUrl` | String | URL to download the update bundle |
| `bundleHash` | String | SHA256 hash of the bundle for verification |
| `bundleSize` | Long | Size of the bundle in bytes |
| `releaseNotes` | String | Release notes describing what's new |
| `isMandatory` | Boolean | Whether this update is mandatory |
| `minAppVersion` | String? | Minimum app version required for this update |

---

## UpdateStatus

Enum representing the status of an update.

### Values

```kotlin
enum class UpdateStatus(val value: String) {
    STARTED("started"),
    DOWNLOADED("downloaded"),
    VERIFIED("verified"),
    INSTALLED("installed"),
    FAILED("failed")
}
```

| Status | Description |
|--------|-------------|
| `STARTED` | Update download has started |
| `DOWNLOADED` | Update has been downloaded |
| `VERIFIED` | Update bundle has been verified |
| `INSTALLED` | Update has been successfully installed |
| `FAILED` | Update process has failed |

---

## UpdateListener

Callback interface for update check results.

### Interface

```kotlin
interface UpdateListener {
    fun onUpdateAvailable(updateInfo: UpdateInfo)
    fun onNoUpdate(currentVersion: String)
    fun onError(error: OTAException)
}
```

### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `onUpdateAvailable` | `updateInfo: UpdateInfo` | Called when an update is available |
| `onNoUpdate` | `currentVersion: String` | Called when no update is available |
| `onError` | `error: OTAException` | Called when an error occurs during check |

---

## DownloadListener

Callback interface for download progress.

### Interface

```kotlin
interface DownloadListener {
    fun onProgress(bytesDownloaded: Long, totalBytes: Long)
    fun onDownloadComplete(filePath: String)
    fun onError(error: OTAException)
}
```

### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `onProgress` | `bytesDownloaded: Long, totalBytes: Long` | Called periodically with download progress |
| `onDownloadComplete` | `filePath: String` | Called when download completes successfully |
| `onError` | `error: OTAException` | Called when download fails |

---

## OTAException

Custom exception class for OTA-related errors.

### Class

```kotlin
class OTAException(
    message: String,
    cause: Throwable? = null
) : Exception(message, cause)
```

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "HTTP 404" | API endpoint not found | Check apiBaseUrl configuration |
| "HTTP 401" | Unauthorized | Verify API authentication |
| "Empty response body" | Invalid server response | Check API server status |
| "Download failed: HTTP XXX" | Network or server error | Retry download |
| "File not found" | Missing bundle file | Re-download the bundle |
| "Bundle hash verification failed" | Corrupted download | Re-download the bundle |

---

## Thread Safety

All suspend functions in `OTAClient` use `withContext(Dispatchers.IO)` for network operations and `withContext(Dispatchers.Main)` for callbacks, ensuring thread safety.

**Important:** Always call OTAClient methods from a coroutine scope (e.g., `lifecycleScope`, `viewModelScope`).

## Error Handling

The SDK uses `OTAException` for all errors. Always implement error callbacks to handle failures gracefully:

```kotlin
override fun onError(error: OTAException) {
    Log.e("OTA", "Error occurred", error)
    // Show user-friendly error message
    // Implement retry logic if appropriate
}
```

## Performance Considerations

- **Network Calls**: All network operations are performed on background threads
- **File I/O**: Large file downloads use buffered streams (8KB buffer)
- **Hash Verification**: Uses efficient streaming SHA256 calculation
- **Progress Updates**: Limited to prevent UI thread congestion

## Version Compatibility

| SDK Version | Min Android SDK | Target Android SDK | Kotlin Version |
|-------------|----------------|-------------------|----------------|
| 1.0.0 | 21 (Android 5.0) | 34 (Android 14) | 1.9+ |
