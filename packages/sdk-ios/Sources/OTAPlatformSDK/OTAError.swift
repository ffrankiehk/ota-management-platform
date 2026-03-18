import Foundation

/// Errors that can occur during OTA operations
public enum OTAError: Error, LocalizedError {
    case invalidURL
    case networkError(Error)
    case invalidResponse
    case decodingError(Error)
    case httpError(statusCode: Int, message: String)
    case fileError(String)
    case verificationFailed
    case missingData
    
    public var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .invalidResponse:
            return "Invalid server response"
        case .decodingError(let error):
            return "Failed to decode response: \(error.localizedDescription)"
        case .httpError(let statusCode, let message):
            return "HTTP \(statusCode): \(message)"
        case .fileError(let message):
            return "File error: \(message)"
        case .verificationFailed:
            return "Bundle verification failed"
        case .missingData:
            return "Missing required data"
        }
    }
}
