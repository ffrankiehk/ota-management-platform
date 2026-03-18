import Foundation
import CryptoKit

/// Main client for OTA Platform operations
public class OTAClient {
    private let config: OTAConfig
    private let session: URLSession
    private let logger: OTALogger
    
    public init(config: OTAConfig) {
        self.config = config
        
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = config.timeoutSeconds
        configuration.timeoutIntervalForResource = config.timeoutSeconds * 2
        
        self.session = URLSession(configuration: configuration)
        self.logger = OTALogger(enabled: config.enableLogging)
    }
    
    // MARK: - Check for Update
    
    /// Check if an update is available
    /// - Parameter completion: Completion handler with result
    public func checkForUpdate(completion: @escaping (Result<UpdateInfo, OTAError>) -> Void) {
        logger.log("Checking for updates...")
        
        var components = URLComponents(string: "\(config.apiBaseUrl)/api/v1/ota/check-update")
        components?.queryItems = [
            URLQueryItem(name: "bundleId", value: config.bundleId),
            URLQueryItem(name: "platform", value: config.platform),
            URLQueryItem(name: "currentVersion", value: config.currentVersion),
            URLQueryItem(name: "deviceId", value: config.deviceId)
        ]
        
        guard let url = components?.url else {
            completion(.failure(.invalidURL))
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        
        let task = session.dataTask(with: request) { [weak self] data, response, error in
            guard let self = self else { return }
            
            if let error = error {
                self.logger.error("Network error: \(error)")
                completion(.failure(.networkError(error)))
                return
            }
            
            guard let httpResponse = response as? HTTPURLResponse else {
                completion(.failure(.invalidResponse))
                return
            }
            
            guard let data = data else {
                completion(.failure(.missingData))
                return
            }
            
            if httpResponse.statusCode != 200 {
                let message = String(data: data, encoding: .utf8) ?? "Unknown error"
                completion(.failure(.httpError(statusCode: httpResponse.statusCode, message: message)))
                return
            }
            
            do {
                let apiResponse = try JSONDecoder().decode(CheckUpdateResponse.self, from: data)
                
                guard apiResponse.success, let updateData = apiResponse.data else {
                    completion(.failure(.invalidResponse))
                    return
                }
                
                if updateData.updateAvailable {
                    let updateInfo = UpdateInfo(
                        updateAvailable: true,
                        currentVersion: updateData.currentVersion,
                        latestVersion: updateData.latestVersion,
                        releaseId: updateData.releaseId ?? "",
                        downloadUrl: updateData.downloadUrl ?? "",
                        bundleHash: updateData.bundleHash ?? "",
                        bundleSize: updateData.bundleSize ?? 0,
                        releaseNotes: updateData.releaseNotes ?? "",
                        isMandatory: updateData.isMandatory ?? false,
                        minAppVersion: updateData.minAppVersion
                    )
                    
                    self.logger.log("Update available: \(updateInfo.latestVersion)")
                    completion(.success(updateInfo))
                } else {
                    let noUpdateInfo = UpdateInfo(
                        updateAvailable: false,
                        currentVersion: updateData.currentVersion,
                        latestVersion: updateData.latestVersion,
                        releaseId: "",
                        downloadUrl: "",
                        bundleHash: "",
                        bundleSize: 0,
                        releaseNotes: "",
                        isMandatory: false
                    )
                    
                    self.logger.log("No update available")
                    completion(.success(noUpdateInfo))
                }
            } catch {
                self.logger.error("Decoding error: \(error)")
                completion(.failure(.decodingError(error)))
            }
        }
        
        task.resume()
    }
    
    // MARK: - Download Update
    
    /// Download an update bundle
    /// - Parameters:
    ///   - updateInfo: Update information
    ///   - downloadDirectory: Directory to save the downloaded file
    ///   - progressHandler: Progress callback (bytesDownloaded, totalBytes)
    ///   - completion: Completion handler with file URL or error
    public func downloadUpdate(
        updateInfo: UpdateInfo,
        downloadDirectory: URL,
        progressHandler: @escaping (Int64, Int64) -> Void,
        completion: @escaping (Result<URL, OTAError>) -> Void
    ) {
        logger.log("Downloading update from \(updateInfo.downloadUrl)")
        
        // Report download started
        reportStatus(releaseId: updateInfo.releaseId, status: .started) { _ in }
        
        guard let url = URL(string: updateInfo.downloadUrl) else {
            completion(.failure(.invalidURL))
            return
        }
        
        let fileName = "update_\(updateInfo.latestVersion).bundle"
        let destinationURL = downloadDirectory.appendingPathComponent(fileName)
        
        let task = session.downloadTask(with: url) { [weak self] tempURL, response, error in
            guard let self = self else { return }
            
            if let error = error {
                self.logger.error("Download error: \(error)")
                
                // Report download failed
                self.reportStatus(
                    releaseId: updateInfo.releaseId,
                    status: .failed,
                    errorMessage: error.localizedDescription
                ) { _ in }
                
                completion(.failure(.networkError(error)))
                return
            }
            
            guard let tempURL = tempURL else {
                completion(.failure(.missingData))
                return
            }
            
            do {
                // Create directory if needed
                try FileManager.default.createDirectory(
                    at: downloadDirectory,
                    withIntermediateDirectories: true
                )
                
                // Remove existing file if any
                try? FileManager.default.removeItem(at: destinationURL)
                
                // Move downloaded file
                try FileManager.default.moveItem(at: tempURL, to: destinationURL)
                
                self.logger.log("Download complete: \(destinationURL.path)")
                
                // Report download completed
                self.reportStatus(releaseId: updateInfo.releaseId, status: .downloaded) { _ in }
                
                completion(.success(destinationURL))
            } catch {
                self.logger.error("File error: \(error)")
                completion(.failure(.fileError(error.localizedDescription)))
            }
        }
        
        // Observe download progress
        let observation = task.progress.observe(\.fractionCompleted) { progress, _ in
            let bytesDownloaded = progress.completedUnitCount
            let totalBytes = progress.totalUnitCount
            progressHandler(bytesDownloaded, totalBytes)
        }
        
        task.resume()
        
        // Keep observation alive
        objc_setAssociatedObject(task, "progressObservation", observation, .OBJC_ASSOCIATION_RETAIN)
    }
    
    // MARK: - Verify Bundle
    
    /// Verify bundle integrity using SHA256 hash
    /// - Parameters:
    ///   - fileURL: URL of the downloaded bundle
    ///   - expectedHash: Expected SHA256 hash
    /// - Returns: True if hash matches, false otherwise
    public func verifyBundle(fileURL: URL, expectedHash: String) -> Bool {
        logger.log("Verifying bundle: \(fileURL.path)")
        
        do {
            let data = try Data(contentsOf: fileURL)
            let hash = SHA256.hash(data: data)
            let hashString = hash.compactMap { String(format: "%02x", $0) }.joined()
            
            let isValid = hashString.lowercased() == expectedHash.lowercased()
            
            logger.log("Bundle hash: \(hashString)")
            logger.log("Expected hash: \(expectedHash)")
            logger.log("Verification: \(isValid ? "PASSED" : "FAILED")")
            
            return isValid
        } catch {
            logger.error("Verification error: \(error)")
            return false
        }
    }
    
    // MARK: - Report Status
    
    /// Report update status to server
    /// - Parameters:
    ///   - releaseId: Release identifier
    ///   - status: Update status
    ///   - errorMessage: Optional error message (for failed status)
    ///   - downloadTimeMs: Optional download time in milliseconds
    ///   - installTimeMs: Optional installation time in milliseconds
    ///   - completion: Completion handler
    public func reportStatus(
        releaseId: String,
        status: UpdateStatus,
        errorMessage: String? = nil,
        downloadTimeMs: Int64? = nil,
        installTimeMs: Int64? = nil,
        completion: @escaping (Result<Void, OTAError>) -> Void
    ) {
        logger.log("Reporting status: \(status.rawValue)")
        
        guard let url = URL(string: "\(config.apiBaseUrl)/api/v1/ota/report-status") else {
            completion(.failure(.invalidURL))
            return
        }
        
        let deviceInfo = DeviceInfo(
            manufacturer: "Apple",
            model: UIDevice.current.model,
            osVersion: UIDevice.current.systemVersion,
            appVersion: config.currentVersion
        )
        
        let requestBody = ReportStatusRequest(
            deviceId: config.deviceId,
            releaseId: releaseId,
            status: status.rawValue,
            errorMessage: errorMessage,
            downloadTimeMs: downloadTimeMs,
            installTimeMs: installTimeMs,
            deviceInfo: deviceInfo
        )
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            request.httpBody = try JSONEncoder().encode(requestBody)
        } catch {
            completion(.failure(.decodingError(error)))
            return
        }
        
        let task = session.dataTask(with: request) { [weak self] data, response, error in
            guard let self = self else { return }
            
            if let error = error {
                self.logger.error("Report status error: \(error)")
                completion(.failure(.networkError(error)))
                return
            }
            
            guard let httpResponse = response as? HTTPURLResponse else {
                completion(.failure(.invalidResponse))
                return
            }
            
            if httpResponse.statusCode == 200 {
                self.logger.log("Status reported successfully: \(status.rawValue)")
                completion(.success(()))
            } else {
                let message = data.flatMap { String(data: $0, encoding: .utf8) } ?? "Unknown error"
                completion(.failure(.httpError(statusCode: httpResponse.statusCode, message: message)))
            }
        }
        
        task.resume()
    }
}

// MARK: - API Models

private struct CheckUpdateResponse: Codable {
    let success: Bool
    let data: CheckUpdateData?
    let message: String
}

private struct CheckUpdateData: Codable {
    let updateAvailable: Bool
    let currentVersion: String
    let latestVersion: String
    let releaseId: String?
    let downloadUrl: String?
    let bundleHash: String?
    let bundleSize: Int64?
    let releaseNotes: String?
    let isMandatory: Bool?
    let minAppVersion: String?
}

private struct ReportStatusRequest: Codable {
    let deviceId: String
    let releaseId: String
    let status: String
    let errorMessage: String?
    let downloadTimeMs: Int64?
    let installTimeMs: Int64?
    let deviceInfo: DeviceInfo
}

private struct DeviceInfo: Codable {
    let manufacturer: String
    let model: String
    let osVersion: String
    let appVersion: String
}

// MARK: - Logger

private class OTALogger {
    private let enabled: Bool
    
    init(enabled: Bool) {
        self.enabled = enabled
    }
    
    func log(_ message: String) {
        guard enabled else { return }
        print("[OTA] \(message)")
    }
    
    func error(_ message: String) {
        guard enabled else { return }
        print("[OTA ERROR] \(message)")
    }
}

#if canImport(UIKit)
import UIKit
#endif
