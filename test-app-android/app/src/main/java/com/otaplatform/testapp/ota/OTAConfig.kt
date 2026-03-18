package com.otaplatform.testapp.ota

data class OTAConfig(
    val apiBaseUrl: String,
    val bundleId: String,
    val platform: String = "android",
    val currentVersion: String,
    val deviceId: String,
    val timeoutSeconds: Int = 30,
    val enableLogging: Boolean = false
)
