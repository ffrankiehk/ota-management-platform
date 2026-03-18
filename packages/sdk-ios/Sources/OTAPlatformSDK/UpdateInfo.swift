import Foundation

/// Information about an available update
public struct UpdateInfo: Codable {
    /// Whether an update is available
    public let updateAvailable: Bool
    
    /// Current installed version
    public let currentVersion: String
    
    /// Latest available version
    public let latestVersion: String
    
    /// Unique release identifier
    public let releaseId: String
    
    /// URL to download the update bundle
    public let downloadUrl: String
    
    /// SHA256 hash of the bundle for verification
    public let bundleHash: String
    
    /// Size of the bundle in bytes
    public let bundleSize: Int64
    
    /// Release notes describing what's new
    public let releaseNotes: String
    
    /// Whether this update is mandatory
    public let isMandatory: Bool
    
    /// Minimum app version required for this update
    public let minAppVersion: String?
    
    public init(
        updateAvailable: Bool,
        currentVersion: String,
        latestVersion: String,
        releaseId: String,
        downloadUrl: String,
        bundleHash: String,
        bundleSize: Int64,
        releaseNotes: String,
        isMandatory: Bool,
        minAppVersion: String? = nil
    ) {
        self.updateAvailable = updateAvailable
        self.currentVersion = currentVersion
        self.latestVersion = latestVersion
        self.releaseId = releaseId
        self.downloadUrl = downloadUrl
        self.bundleHash = bundleHash
        self.bundleSize = bundleSize
        self.releaseNotes = releaseNotes
        self.isMandatory = isMandatory
        self.minAppVersion = minAppVersion
    }
}
