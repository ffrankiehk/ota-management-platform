# OTA Platform iOS SDK

iOS SDK for OTA Platform - Over-the-Air update management for iOS applications.

## Features

- ✅ Check for updates from OTA Platform API
- ✅ Download update bundles with progress tracking
- ✅ SHA256 integrity verification
- ✅ Status reporting (started, downloaded, verified, installed, failed)
- ✅ Swift async/await support
- ✅ Swift Package Manager support
- ✅ CocoaPods support
- ✅ Minimal dependencies (built-in URLSession + CryptoKit)

## Requirements

- iOS 13.0+ / macOS 10.15+
- Xcode 14.0+
- Swift 5.9+

## Installation

### Swift Package Manager

Add the following to your `Package.swift` file:

```swift
dependencies: [
    .package(url: "https://github.com/your-org/ota-platform-ios-sdk.git", from: "1.0.0")
]
```

Or in Xcode:
1. File → Add Packages...
2. Enter package URL
3. Select version and add to project

### CocoaPods

Add to your `Podfile`:

```ruby
pod 'OTAPlatformSDK', '~> 1.0.0'
```

Then run:
```bash
pod install
```

## Quick Start

### 1. Initialize OTA Client

```swift
import OTAPlatformSDK

let config = OTAConfig(
    apiBaseUrl: "https://your-ota-api.com",
    bundleId: Bundle.main.bundleIdentifier ?? "",
    currentVersion: Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "",
    deviceId: UIDevice.current.identifierForVendor?.uuidString ?? UUID().uuidString,
    enableLogging: true
)

let otaClient = OTAClient(config: config)
```

### 2. Check for Updates

```swift
otaClient.checkForUpdate { result in
    switch result {
    case .success(let updateInfo):
        if updateInfo.updateAvailable {
            print("New version available: \(updateInfo.latestVersion)")
            
            if updateInfo.isMandatory {
                // Force update
                self.downloadAndInstall(updateInfo)
            } else {
                // Show update dialog
                self.showUpdateAlert(updateInfo)
            }
        } else {
            print("Already on latest version: \(updateInfo.currentVersion)")
        }
        
    case .failure(let error):
        print("Check update failed: \(error)")
    }
}
```

### 3. Download Update

```swift
let downloadDirectory = FileManager.default.temporaryDirectory
    .appendingPathComponent("ota_updates")

otaClient.downloadUpdate(
    updateInfo: updateInfo,
    downloadDirectory: downloadDirectory,
    progressHandler: { bytesDownloaded, totalBytes in
        let progress = Double(bytesDownloaded) / Double(totalBytes)
        print("Download progress: \(Int(progress * 100))%")
        
        DispatchQueue.main.async {
            self.updateProgressView(progress)
        }
    },
    completion: { result in
        switch result {
        case .success(let fileURL):
            print("Download complete: \(fileURL)")
            self.verifyAndInstall(fileURL: fileURL, updateInfo: updateInfo)
            
        case .failure(let error):
            print("Download failed: \(error)")
        }
    }
)
```

### 4. Verify and Install

```swift
func verifyAndInstall(fileURL: URL, updateInfo: UpdateInfo) {
    // Verify bundle hash
    let isValid = otaClient.verifyBundle(
        fileURL: fileURL,
        expectedHash: updateInfo.bundleHash
    )
    
    if isValid {
        // Report verification success
        otaClient.reportStatus(
            releaseId: updateInfo.releaseId,
            status: .verified
        ) { _ in }
        
        // Install update (your implementation)
        installBundle(fileURL: fileURL)
        
        // Report installation success
        otaClient.reportStatus(
            releaseId: updateInfo.releaseId,
            status: .installed
        ) { result in
            if case .success = result {
                print("Update installed successfully")
            }
        }
    } else {
        // Report verification failed
        otaClient.reportStatus(
            releaseId: updateInfo.releaseId,
            status: .failed,
            errorMessage: "Bundle hash verification failed"
        ) { _ in }
        
        print("Verification failed")
    }
}
```

## API Reference

See [API.md](./API.md) for complete API documentation.

## Integration Guide

See [INTEGRATION.md](./INTEGRATION.md) for detailed integration instructions.

## License

MIT License
