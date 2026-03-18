import Foundation

/// Configuration for OTA Client
public struct OTAConfig {
    /// Base URL of the OTA Platform API
    public let apiBaseUrl: String
    
    /// Application bundle identifier
    public let bundleId: String
    
    /// Platform identifier (default: "ios")
    public let platform: String
    
    /// Current app version
    public let currentVersion: String
    
    /// Unique device identifier
    public let deviceId: String
    
    /// Network request timeout in seconds (default: 30)
    public let timeoutSeconds: TimeInterval
    
    /// Enable debug logging (default: false)
    public let enableLogging: Bool
    
    public init(
        apiBaseUrl: String,
        bundleId: String,
        platform: String = "ios",
        currentVersion: String,
        deviceId: String,
        timeoutSeconds: TimeInterval = 30,
        enableLogging: Bool = false
    ) {
        self.apiBaseUrl = apiBaseUrl
        self.bundleId = bundleId
        self.platform = platform
        self.currentVersion = currentVersion
        self.deviceId = deviceId
        self.timeoutSeconds = timeoutSeconds
        self.enableLogging = enableLogging
    }
}
