package com.otaplatform.sdk

class OTAException(
    message: String,
    cause: Throwable? = null
) : Exception(message, cause)
