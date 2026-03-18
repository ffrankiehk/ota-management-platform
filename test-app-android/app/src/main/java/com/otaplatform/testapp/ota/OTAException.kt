package com.otaplatform.testapp.ota

class OTAException(
    message: String,
    cause: Throwable? = null
) : Exception(message, cause)
