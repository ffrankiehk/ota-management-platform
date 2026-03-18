package com.otaplatform.sdk

interface UpdateListener {
    fun onUpdateAvailable(updateInfo: UpdateInfo)
    fun onNoUpdate(currentVersion: String)
    fun onError(error: OTAException)
}
