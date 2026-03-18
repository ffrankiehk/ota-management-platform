import Foundation

/// Status of an update operation
public enum UpdateStatus: String, Codable {
    case started = "started"
    case downloaded = "downloaded"
    case verified = "verified"
    case installed = "installed"
    case failed = "failed"
}
