package com.otaplatform.sdk

import android.util.Log
import com.google.gson.Gson
import com.google.gson.annotations.SerializedName
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File
import java.io.FileOutputStream
import java.security.MessageDigest
import java.util.concurrent.TimeUnit

class OTAClient(private val config: OTAConfig) {

    private val client = OkHttpClient.Builder()
        .connectTimeout(config.timeoutSeconds.toLong(), TimeUnit.SECONDS)
        .readTimeout(config.timeoutSeconds.toLong(), TimeUnit.SECONDS)
        .writeTimeout(config.timeoutSeconds.toLong(), TimeUnit.SECONDS)
        .build()

    private val gson = Gson()
    private val tag = "OTAClient"

    // API Response Models
    private data class CheckUpdateResponse(
        val success: Boolean,
        val data: CheckUpdateData?,
        val message: String,
        val timestamp: String
    )

    private data class CheckUpdateData(
        val updateAvailable: Boolean,
        val currentVersion: String,
        val latestVersion: String,
        val releaseId: String?,
        val downloadUrl: String?,
        val bundleHash: String?,
        val bundleSize: Long?,
        val releaseNotes: String?,
        val isMandatory: Boolean?,
        val minAppVersion: String?
    )

    private data class ReportStatusRequest(
        val deviceId: String,
        val releaseId: String,
        val status: String,
        val errorMessage: String? = null,
        val downloadTimeMs: Long? = null,
        val installTimeMs: Long? = null,
        val deviceInfo: DeviceInfo? = null
    )

    private data class DeviceInfo(
        val manufacturer: String,
        val model: String,
        val osVersion: String,
        val appVersion: String
    )

    private data class ReportStatusResponse(
        val success: Boolean,
        val message: String,
        val timestamp: String
    )

    /**
     * Check for available updates
     */
    suspend fun checkForUpdate(listener: UpdateListener) = withContext(Dispatchers.IO) {
        try {
            log("Checking for updates...")

            val url = "${config.apiBaseUrl}/api/v1/ota/check-update?" +
                    "bundleId=${config.bundleId}" +
                    "&platform=${config.platform}" +
                    "&currentVersion=${config.currentVersion}" +
                    "&deviceId=${config.deviceId}"

            val request = Request.Builder()
                .url(url)
                .get()
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    throw OTAException("HTTP ${response.code}: ${response.message}")
                }

                val body = response.body?.string()
                    ?: throw OTAException("Empty response body")

                val checkUpdateResponse = gson.fromJson(body, CheckUpdateResponse::class.java)

                if (!checkUpdateResponse.success || checkUpdateResponse.data == null) {
                    throw OTAException(checkUpdateResponse.message)
                }

                val data = checkUpdateResponse.data

                if (data.updateAvailable) {
                    val updateInfo = UpdateInfo(
                        updateAvailable = true,
                        currentVersion = data.currentVersion,
                        latestVersion = data.latestVersion,
                        releaseId = data.releaseId ?: "",
                        downloadUrl = data.downloadUrl ?: "",
                        bundleHash = data.bundleHash ?: "",
                        bundleSize = data.bundleSize ?: 0L,
                        releaseNotes = data.releaseNotes ?: "",
                        isMandatory = data.isMandatory ?: false,
                        minAppVersion = data.minAppVersion
                    )
                    log("Update available: ${updateInfo.latestVersion}")
                    withContext(Dispatchers.Main) {
                        listener.onUpdateAvailable(updateInfo)
                    }
                } else {
                    log("No update available")
                    withContext(Dispatchers.Main) {
                        listener.onNoUpdate(data.currentVersion)
                    }
                }
            }
        } catch (e: Exception) {
            logError("Check update failed", e)
            val otaException = if (e is OTAException) e else OTAException("Check update failed", e)
            withContext(Dispatchers.Main) {
                listener.onError(otaException)
            }
        }
    }

    /**
     * Download update bundle
     */
    suspend fun downloadUpdate(
        updateInfo: UpdateInfo,
        downloadDir: File,
        listener: DownloadListener
    ) = withContext(Dispatchers.IO) {
        try {
            log("Downloading update from ${updateInfo.downloadUrl}")

            // Report download started
            reportStatus(updateInfo.releaseId, UpdateStatus.STARTED)

            val request = Request.Builder()
                .url(updateInfo.downloadUrl)
                .get()
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    throw OTAException("Download failed: HTTP ${response.code}")
                }

                val body = response.body ?: throw OTAException("Empty response body")
                val totalBytes = body.contentLength()

                if (!downloadDir.exists()) {
                    downloadDir.mkdirs()
                }

                val fileName = "update_${updateInfo.latestVersion}.bundle"
                val file = File(downloadDir, fileName)

                FileOutputStream(file).use { output ->
                    val buffer = ByteArray(8192)
                    var bytesRead: Int
                    var totalBytesRead = 0L

                    body.byteStream().use { input ->
                        while (input.read(buffer).also { bytesRead = it } != -1) {
                            output.write(buffer, 0, bytesRead)
                            totalBytesRead += bytesRead

                            withContext(Dispatchers.Main) {
                                listener.onProgress(totalBytesRead, totalBytes)
                            }
                        }
                    }
                }

                log("Download complete: ${file.absolutePath}")

                // Report download completed
                reportStatus(updateInfo.releaseId, UpdateStatus.DOWNLOADED)

                withContext(Dispatchers.Main) {
                    listener.onDownloadComplete(file.absolutePath)
                }
            }
        } catch (e: Exception) {
            logError("Download failed", e)
            val otaException = if (e is OTAException) e else OTAException("Download failed", e)
            
            // Report download failed
            try {
                reportStatus(
                    updateInfo.releaseId,
                    UpdateStatus.FAILED,
                    errorMessage = e.message
                )
            } catch (reportError: Exception) {
                logError("Failed to report download failure", reportError)
            }

            withContext(Dispatchers.Main) {
                listener.onError(otaException)
            }
        }
    }

    /**
     * Verify bundle integrity using SHA256 hash
     */
    suspend fun verifyBundle(filePath: String, expectedHash: String): Boolean =
        withContext(Dispatchers.IO) {
            try {
                log("Verifying bundle: $filePath")

                val file = File(filePath)
                if (!file.exists()) {
                    throw OTAException("File not found: $filePath")
                }

                val digest = MessageDigest.getInstance("SHA-256")
                file.inputStream().use { input ->
                    val buffer = ByteArray(8192)
                    var bytesRead: Int
                    while (input.read(buffer).also { bytesRead = it } != -1) {
                        digest.update(buffer, 0, bytesRead)
                    }
                }

                val hash = digest.digest().joinToString("") { "%02x".format(it) }
                val isValid = hash.equals(expectedHash, ignoreCase = true)

                log("Bundle hash: $hash")
                log("Expected hash: $expectedHash")
                log("Verification: ${if (isValid) "PASSED" else "FAILED"}")

                isValid
            } catch (e: Exception) {
                logError("Verification failed", e)
                false
            }
        }

    /**
     * Report update status to server
     */
    suspend fun reportStatus(
        releaseId: String,
        status: UpdateStatus,
        errorMessage: String? = null,
        downloadTimeMs: Long? = null,
        installTimeMs: Long? = null
    ) = withContext(Dispatchers.IO) {
        try {
            log("Reporting status: ${status.value}")

            val deviceInfo = DeviceInfo(
                manufacturer = android.os.Build.MANUFACTURER,
                model = android.os.Build.MODEL,
                osVersion = android.os.Build.VERSION.RELEASE,
                appVersion = config.currentVersion
            )

            val requestBody = ReportStatusRequest(
                deviceId = config.deviceId,
                releaseId = releaseId,
                status = status.value,
                errorMessage = errorMessage,
                downloadTimeMs = downloadTimeMs,
                installTimeMs = installTimeMs,
                deviceInfo = deviceInfo
            )

            val json = gson.toJson(requestBody)
            val body = json.toRequestBody("application/json".toMediaType())

            val request = Request.Builder()
                .url("${config.apiBaseUrl}/api/v1/ota/report-status")
                .post(body)
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    throw OTAException("Report status failed: HTTP ${response.code}")
                }

                val responseBody = response.body?.string()
                    ?: throw OTAException("Empty response body")

                val reportResponse = gson.fromJson(responseBody, ReportStatusResponse::class.java)

                if (!reportResponse.success) {
                    throw OTAException(reportResponse.message)
                }

                log("Status reported successfully: ${status.value}")
            }
        } catch (e: Exception) {
            logError("Report status failed", e)
            throw if (e is OTAException) e else OTAException("Report status failed", e)
        }
    }

    private fun log(message: String) {
        if (config.enableLogging) {
            Log.d(tag, message)
        }
    }

    private fun logError(message: String, error: Throwable?) {
        if (config.enableLogging) {
            Log.e(tag, message, error)
        }
    }
}
