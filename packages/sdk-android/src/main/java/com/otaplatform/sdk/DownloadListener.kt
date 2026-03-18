package com.otaplatform.sdk

interface DownloadListener {
    fun onProgress(bytesDownloaded: Long, totalBytes: Long)
    fun onDownloadComplete(filePath: String)
    fun onError(error: OTAException)
}
