package com.otaplatform.sdk

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
