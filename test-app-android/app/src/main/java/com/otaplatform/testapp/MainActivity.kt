package com.otaplatform.testapp

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.FileProvider
import androidx.lifecycle.lifecycleScope
import com.otaplatform.testapp.databinding.ActivityMainBinding
import com.otaplatform.testapp.ota.OTAClient
import com.otaplatform.testapp.ota.OTAConfig
import com.otaplatform.testapp.ota.UpdateInfo
import com.otaplatform.testapp.ota.UpdateStatus
import kotlinx.coroutines.launch
import java.io.File

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private lateinit var otaClient: OTAClient
    private var currentUpdateInfo: UpdateInfo? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // 初始化 OTA Client
        val config = OTAConfig(
            apiBaseUrl = "http://34.143.178.171:3000", // VM 服务器地址
            bundleId = "com.otaplatform.testapp",
            platform = "android",
            currentVersion = BuildConfig.VERSION_NAME,
            deviceId = getOTADeviceId(),
            enableLogging = true
        )

        otaClient = OTAClient(config)

        updateVersionInfo()
        addLog("應用啟動")
        addLog("連接 OTA 服務器: ${config.apiBaseUrl}")
        
        // 自動檢查更新
        checkForUpdateAuto()
    }


    private fun updateVersionInfo() {
        binding.tvCurrentVersion.text = "v${BuildConfig.VERSION_NAME}"
        binding.tvDeviceId.text = "設備 ID: ${getOTADeviceId()}"
    }

    private fun addLog(message: String) {
        runOnUiThread {
            val currentLog = binding.tvLog.text.toString()
            val timestamp = java.text.SimpleDateFormat("HH:mm:ss", java.util.Locale.getDefault()).format(java.util.Date())
            binding.tvLog.text = "$currentLog\n[$timestamp] $message"
        }
    }

    private fun updateStatus(message: String) {
        runOnUiThread {
            binding.tvStatus.text = message
        }
    }

    private fun checkForUpdateAuto() {
        updateStatus("正在檢查更新...")
        addLog("開始檢查更新")
        
        lifecycleScope.launch {
            try {
                val updateInfo = otaClient.checkForUpdate()

                if (updateInfo.updateAvailable) {
                    addLog("發現新版本: ${updateInfo.latestVersion}")
                    updateStatus("發現新版本 ${updateInfo.latestVersion}")
                    
                    currentUpdateInfo = updateInfo
                    binding.cardUpdateInfo.visibility = View.VISIBLE
                    binding.tvLatestVersion.text = "最新版本: ${updateInfo.latestVersion}"
                    binding.tvReleaseNotes.text = "正在自動下載..."

                    // 自動開始下載
                    downloadUpdateAuto(updateInfo)
                } else {
                    addLog("已是最新版本")
                    updateStatus("✓ 已是最新版本")
                    currentUpdateInfo = null
                    binding.cardUpdateInfo.visibility = View.GONE
                }
            } catch (e: Exception) {
                addLog("檢查更新失敗: ${e.message}")
                updateStatus("✗ 檢查更新失敗")
            }
        }
    }

    private fun downloadUpdateAuto(updateInfo: UpdateInfo) {
        addLog("開始下載更新包")
        updateStatus("正在下載更新...")
        binding.progressBar.visibility = View.VISIBLE
        binding.tvProgress.visibility = View.VISIBLE

        lifecycleScope.launch {
            val downloadDir = File(getExternalFilesDir(null), "ota_updates")

            otaClient.downloadUpdate(updateInfo, downloadDir, object : com.otaplatform.testapp.ota.DownloadListener {
                override fun onProgress(bytesDownloaded: Long, totalBytes: Long) {
                    val progress = if (totalBytes > 0) (bytesDownloaded.toFloat() / totalBytes.toFloat()) else 0f
                    runOnUiThread {
                        binding.progressBar.progress = (progress * 100).toInt()
                        binding.tvProgress.text = "下載進度: ${(progress * 100).toInt()}%"
                    }
                }

                override fun onDownloadComplete(filePath: String) {
                    lifecycleScope.launch {
                        try {
                            addLog("下載完成，開始校驗")
                            runOnUiThread {
                                binding.tvProgress.text = "正在校驗..."
                                updateStatus("正在校驗更新包...")
                            }

                            val isValid = otaClient.verifyBundle(filePath, updateInfo.bundleHash)

                            if (isValid) {
                                addLog("校驗成功")
                                otaClient.reportStatus(updateInfo.releaseId, UpdateStatus.VERIFIED)

                                // 自動安裝
                                runOnUiThread {
                                    installUpdateAuto(filePath, updateInfo)
                                }
                            } else {
                                addLog("校驗失敗")
                                updateStatus("✗ 校驗失敗")
                                otaClient.reportStatus(
                                    updateInfo.releaseId,
                                    UpdateStatus.FAILED,
                                    errorMessage = "Bundle verification failed"
                                )
                                runOnUiThread {
                                    binding.progressBar.visibility = View.GONE
                                    binding.tvProgress.visibility = View.GONE
                                }
                            }
                        } catch (e: Exception) {
                            addLog("校驗錯誤: ${e.message}")
                            updateStatus("✗ 校驗錯誤")
                            runOnUiThread {
                                binding.progressBar.visibility = View.GONE
                                binding.tvProgress.visibility = View.GONE
                            }
                        }
                    }
                }

                override fun onError(error: com.otaplatform.testapp.ota.OTAException) {
                    addLog("下載失敗: ${error.message}")
                    updateStatus("✗ 下載失敗")
                    runOnUiThread {
                        binding.progressBar.visibility = View.GONE
                        binding.tvProgress.visibility = View.GONE
                    }
                }
            })
        }
    }

    private fun installApk(apkFile: File, updateInfo: com.otaplatform.testapp.ota.UpdateInfo) {
        addLog("啟動 APK 安裝")
        
        try {
            val intent = Intent(Intent.ACTION_VIEW)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                // Android 7.0+ 需要使用 FileProvider
                val apkUri = FileProvider.getUriForFile(
                    this,
                    "${applicationContext.packageName}.fileprovider",
                    apkFile
                )
                intent.setDataAndType(apkUri, "application/vnd.android.package-archive")
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            } else {
                intent.setDataAndType(Uri.fromFile(apkFile), "application/vnd.android.package-archive")
            }
            
            // 上報下載完成
            lifecycleScope.launch {
                otaClient.reportStatus(updateInfo.releaseId, UpdateStatus.DOWNLOADED)
            }
            
            startActivity(intent)
            addLog("已啟動安裝程序")
            updateStatus("請在安裝程序中完成安裝")
            
            binding.progressBar.visibility = View.GONE
            binding.tvProgress.visibility = View.GONE
            
        } catch (e: Exception) {
            addLog("啟動安裝失敗: ${e.message}")
            updateStatus("✗ 啟動安裝失敗")
        }
    }

    private fun installUpdateAuto(filePath: String, updateInfo: com.otaplatform.testapp.ota.UpdateInfo) {
        addLog("開始安裝更新")
        updateStatus("正在安裝更新...")
        
        lifecycleScope.launch {
            try {
                // 解壓 ZIP 並找到 APK 文件
                val zipFile = File(filePath)
                val extractDir = File(cacheDir, "ota_extract")
                extractDir.mkdirs()
                
                // 解壓 ZIP
                java.util.zip.ZipInputStream(zipFile.inputStream()).use { zis ->
                    var entry = zis.nextEntry
                    while (entry != null) {
                        if (entry.name.endsWith(".apk")) {
                            val apkFile = File(extractDir, "update.apk")
                            apkFile.outputStream().use { output ->
                                zis.copyTo(output)
                            }
                            
                            // 安裝 APK
                            runOnUiThread {
                                installApk(apkFile, updateInfo)
                            }
                            break
                        }
                        entry = zis.nextEntry
                    }
                }
            } catch (e: Exception) {
                addLog("安裝失敗: ${e.message}")
                updateStatus("✗ 安裝失敗")
            }
        }
    }


    private fun showError(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    }

    private fun getOTADeviceId(): String {
        val prefs = getSharedPreferences("ota_prefs", MODE_PRIVATE)
        var deviceId = prefs.getString("device_id", null)
        if (deviceId == null) {
            deviceId = "android-${System.currentTimeMillis()}"
            prefs.edit().putString("device_id", deviceId).apply()
        }
        return deviceId
    }

    private fun formatFileSize(bytes: Long): String {
        return when {
            bytes < 1024 -> "$bytes B"
            bytes < 1024 * 1024 -> "${bytes / 1024} KB"
            else -> "${bytes / (1024 * 1024)} MB"
        }
    }
}
