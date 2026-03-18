package com.otaplatform.testapp.ota

enum class UpdateStatus(val value: String) {
    STARTED("started"),
    DOWNLOADED("downloaded"),
    VERIFIED("verified"),
    INSTALLED("installed"),
    FAILED("failed")
}
