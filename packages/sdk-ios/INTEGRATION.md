# OTA Platform iOS SDK - Integration Guide

Complete guide for integrating OTA Platform SDK into your iOS application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Basic Setup](#basic-setup)
4. [Usage Examples](#usage-examples)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

- **iOS 13.0+** or **macOS 10.15+**
- **Xcode 14.0+**
- **Swift 5.9+**
- **CocoaPods** or **Swift Package Manager**

## Installation

### Option 1: Swift Package Manager (Recommended)

#### Using Xcode

1. Open your project in Xcode
2. Go to **File → Add Packages...**
3. Enter the package URL:
   ```
   https://github.com/your-org/ota-platform-ios-sdk.git
   ```
4. Select version rule (e.g., "Up to Next Major Version" with 1.0.0)
5. Click **Add Package**
6. Select **OTAPlatformSDK** and add to your target

#### Using Package.swift

Add to your `Package.swift` dependencies:

```swift
dependencies: [
    .package(url: "https://github.com/your-org/ota-platform-ios-sdk.git", from: "1.0.0")
]
```

Then add to your target:

```swift
.target(
    name: "YourApp",
    dependencies: ["OTAPlatformSDK"]
)
```

### Option 2: CocoaPods

Add to your `Podfile`:

```ruby
pod 'OTAPlatformSDK', '~> 1.0.0'
```

Then run:

```bash
pod install
```

## Basic Setup

### 1. Import the SDK

```swift
import OTAPlatformSDK
```

### 2. Initialize OTA Client

Create an `OTAClient` instance in your app. Typically in `AppDelegate` or a singleton manager:

```swift
import UIKit
import OTAPlatformSDK

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    
    var otaClient: OTAClient!
    
    func application(_ application: UIApplication, 
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        
        setupOTAClient()
        
        return true
    }
    
    private func setupOTAClient() {
        let config = OTAConfig(
            apiBaseUrl: "https://your-ota-api.com",
            bundleId: Bundle.main.bundleIdentifier ?? "com.yourapp",
            currentVersion: getCurrentVersion(),
            deviceId: getDeviceId(),
            enableLogging: isDebugBuild()
        )
        
        otaClient = OTAClient(config: config)
    }
    
    private func getCurrentVersion() -> String {
        return Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0"
    }
    
    private func getDeviceId() -> String {
        // Use UserDefaults to persist device ID
        let key = "com.yourapp.deviceId"
        
        if let existing = UserDefaults.standard.string(forKey: key) {
            return existing
        }
        
        // Generate new device ID
        let newId = UIDevice.current.identifierForVendor?.uuidString ?? UUID().uuidString
        UserDefaults.standard.set(newId, forKey: key)
        
        return newId
    }
    
    private func isDebugBuild() -> Bool {
        #if DEBUG
        return true
        #else
        return false
        #endif
    }
}
```

### 3. Access OTA Client from View Controllers

```swift
class MyViewController: UIViewController {
    
    var otaClient: OTAClient {
        return (UIApplication.shared.delegate as! AppDelegate).otaClient
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        checkForUpdates()
    }
    
    func checkForUpdates() {
        otaClient.checkForUpdate { result in
            // Handle result
        }
    }
}
```

## Usage Examples

### Example 1: Check for Updates on App Launch

```swift
import UIKit
import OTAPlatformSDK

class MainViewController: UIViewController {
    
    var otaClient: OTAClient {
        return (UIApplication.shared.delegate as! AppDelegate).otaClient
    }
    
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        
        // Check for updates after a short delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            self.checkForUpdates()
        }
    }
    
    private func checkForUpdates() {
        otaClient.checkForUpdate { [weak self] result in
            DispatchQueue.main.async {
                switch result {
                case .success(let updateInfo):
                    if updateInfo.updateAvailable {
                        self?.showUpdateDialog(updateInfo)
                    } else {
                        print("App is up to date: \(updateInfo.currentVersion)")
                    }
                    
                case .failure(let error):
                    print("Check update failed: \(error.localizedDescription)")
                    // Show error only if critical
                }
            }
        }
    }
}
```

### Example 2: Show Update Dialog

```swift
private func showUpdateDialog(_ updateInfo: UpdateInfo) {
    let message = """
    A new version \(updateInfo.latestVersion) is available!
    
    What's new:
    \(updateInfo.releaseNotes)
    
    Size: \(formatBytes(updateInfo.bundleSize))
    """
    
    let alert = UIAlertController(
        title: updateInfo.isMandatory ? "Update Required" : "Update Available",
        message: message,
        preferredStyle: .alert
    )
    
    alert.addAction(UIAlertAction(title: "Update", style: .default) { _ in
        self.downloadAndInstallUpdate(updateInfo)
    })
    
    if !updateInfo.isMandatory {
        alert.addAction(UIAlertAction(title: "Later", style: .cancel))
    }
    
    present(alert, animated: true)
}

private func formatBytes(_ bytes: Int64) -> String {
    let formatter = ByteCountFormatter()
    formatter.allowedUnits = [.useKB, .useMB, .useGB]
    formatter.countStyle = .file
    return formatter.string(fromByteCount: bytes)
}
```

### Example 3: Download with Progress

```swift
private func downloadAndInstallUpdate(_ updateInfo: UpdateInfo) {
    // Show progress HUD
    let progressAlert = UIAlertController(
        title: "Downloading Update",
        message: "Downloading \(updateInfo.latestVersion)...\n\n\n",
        preferredStyle: .alert
    )
    
    let progressView = UIProgressView(progressViewStyle: .default)
    progressView.translatesAutoresizingMaskIntoConstraints = false
    progressAlert.view.addSubview(progressView)
    
    NSLayoutConstraint.activate([
        progressView.leadingAnchor.constraint(equalTo: progressAlert.view.leadingAnchor, constant: 20),
        progressView.trailingAnchor.constraint(equalTo: progressAlert.view.trailingAnchor, constant: -20),
        progressView.bottomAnchor.constraint(equalTo: progressAlert.view.bottomAnchor, constant: -50)
    ])
    
    present(progressAlert, animated: true)
    
    // Download directory
    let downloadDir = FileManager.default.temporaryDirectory
        .appendingPathComponent("ota_updates")
    
    otaClient.downloadUpdate(
        updateInfo: updateInfo,
        downloadDirectory: downloadDir,
        progressHandler: { bytesDownloaded, totalBytes in
            DispatchQueue.main.async {
                let progress = Float(bytesDownloaded) / Float(totalBytes)
                progressView.progress = progress
                
                let percent = Int(progress * 100)
                progressAlert.message = "Downloading \(updateInfo.latestVersion)... \(percent)%\n\n\n"
            }
        },
        completion: { [weak self] result in
            DispatchQueue.main.async {
                progressAlert.dismiss(animated: true) {
                    switch result {
                    case .success(let fileURL):
                        self?.verifyAndInstall(fileURL: fileURL, updateInfo: updateInfo)
                        
                    case .failure(let error):
                        self?.showError("Download failed: \(error.localizedDescription)")
                    }
                }
            }
        }
    )
}
```

### Example 4: Verify and Install

```swift
private func verifyAndInstall(fileURL: URL, updateInfo: UpdateInfo) {
    // Show verification alert
    let verifyAlert = UIAlertController(
        title: "Verifying Update",
        message: "Please wait...",
        preferredStyle: .alert
    )
    present(verifyAlert, animated: true)
    
    DispatchQueue.global(qos: .userInitiated).async { [weak self] in
        guard let self = self else { return }
        
        // Verify bundle hash
        let isValid = self.otaClient.verifyBundle(
            fileURL: fileURL,
            expectedHash: updateInfo.bundleHash
        )
        
        DispatchQueue.main.async {
            verifyAlert.dismiss(animated: true) {
                if isValid {
                    // Report verified
                    self.otaClient.reportStatus(
                        releaseId: updateInfo.releaseId,
                        status: .verified
                    ) { _ in }
                    
                    // Install update
                    self.installUpdate(fileURL: fileURL, updateInfo: updateInfo)
                } else {
                    // Report verification failed
                    self.otaClient.reportStatus(
                        releaseId: updateInfo.releaseId,
                        status: .failed,
                        errorMessage: "Bundle hash verification failed"
                    ) { _ in }
                    
                    self.showError("Update verification failed")
                }
            }
        }
    }
}

private func installUpdate(fileURL: URL, updateInfo: UpdateInfo) {
    // TODO: Implement your bundle installation logic
    // This depends on your app architecture
    
    // For example, for React Native CodePush-style updates:
    // 1. Extract the bundle
    // 2. Copy to app's bundle directory
    // 3. Update UserDefaults with new bundle path
    // 4. Restart app
    
    // Report successful installation
    otaClient.reportStatus(
        releaseId: updateInfo.releaseId,
        status: .installed
    ) { [weak self] result in
        DispatchQueue.main.async {
            if case .success = result {
                self?.showSuccessAndRestart()
            }
        }
    }
}

private func showSuccessAndRestart() {
    let alert = UIAlertController(
        title: "Update Installed",
        message: "The update has been installed successfully. The app will now restart.",
        preferredStyle: .alert
    )
    
    alert.addAction(UIAlertAction(title: "Restart", style: .default) { _ in
        // Restart app
        fatalError("Restart app")
    })
    
    present(alert, animated: true)
}

private func showError(_ message: String) {
    let alert = UIAlertController(
        title: "Error",
        message: message,
        preferredStyle: .alert
    )
    alert.addAction(UIAlertAction(title: "OK", style: .default))
    present(alert, animated: true)
}
```

## Best Practices

### 1. Check for Updates Wisely

Don't check on every app launch. Use throttling:

```swift
class UpdateManager {
    private let updateCheckInterval: TimeInterval = 6 * 60 * 60 // 6 hours
    private let lastCheckKey = "com.yourapp.lastUpdateCheck"
    
    func checkForUpdatesIfNeeded() {
        let lastCheck = UserDefaults.standard.double(forKey: lastCheckKey)
        let now = Date().timeIntervalSince1970
        
        guard now - lastCheck > updateCheckInterval else {
            return
        }
        
        checkForUpdates()
        UserDefaults.standard.set(now, forKey: lastCheckKey)
    }
}
```

### 2. Handle Mandatory Updates

Block app usage until update is installed:

```swift
if updateInfo.isMandatory {
    // Show non-dismissible alert
    let alert = UIAlertController(
        title: "Update Required",
        message: "This update is required to continue using the app.",
        preferredStyle: .alert
    )
    alert.addAction(UIAlertAction(title: "Update Now", style: .default) { _ in
        self.downloadAndInstallUpdate(updateInfo)
    })
    
    // Make it non-dismissible
    present(alert, animated: true)
}
```

### 3. Network Error Handling

```swift
case .failure(let error):
    switch error {
    case .networkError(let underlyingError):
        if (underlyingError as NSError).code == NSURLErrorNotConnectedToInternet {
            // No internet connection
            print("No internet connection")
        } else if (underlyingError as NSError).code == NSURLErrorTimedOut {
            // Timeout
            print("Request timed out")
        }
        
    case .httpError(let statusCode, let message):
        print("HTTP \(statusCode): \(message)")
        
    default:
        print("Error: \(error.localizedDescription)")
    }
```

### 4. Background Downloads

For large updates, use background URLSession:

```swift
class OTAManager {
    private lazy var backgroundSession: URLSession = {
        let config = URLSessionConfiguration.background(
            withIdentifier: "com.yourapp.ota.background"
        )
        return URLSession(configuration: config, delegate: self, delegateQueue: nil)
    }()
    
    // Implement URLSessionDelegate methods
}
```

### 5. Storage Management

Clean up old update files:

```swift
func cleanupOldUpdates() {
    let downloadDir = FileManager.default.temporaryDirectory
        .appendingPathComponent("ota_updates")
    
    guard let files = try? FileManager.default.contentsOfDirectory(
        at: downloadDir,
        includingPropertiesForKeys: [.contentModificationDateKey]
    ) else {
        return
    }
    
    let sevenDaysAgo = Date().addingTimeInterval(-7 * 24 * 60 * 60)
    
    for file in files {
        guard let modDate = try? file.resourceValues(forKeys: [.contentModificationDateKey]).contentModificationDate else {
            continue
        }
        
        if modDate < sevenDaysAgo {
            try? FileManager.default.removeItem(at: file)
        }
    }
}
```

## Troubleshooting

### Issue: App Transport Security (ATS)

If your API uses HTTP (not HTTPS), you need to configure ATS in `Info.plist`:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <false/>
    <key>NSExceptionDomains</key>
    <dict>
        <key>your-api-domain.com</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <true/>
            <key>NSIncludesSubdomains</key>
            <true/>
        </dict>
    </dict>
</dict>
```

**Note:** For production, always use HTTPS!

### Issue: Background Downloads Not Working

Ensure your app handles background URLSession events:

```swift
func application(_ application: UIApplication,
                 handleEventsForBackgroundURLSession identifier: String,
                 completionHandler: @escaping () -> Void) {
    // Store completion handler
    // Call it when all background tasks complete
}
```

### Issue: Device ID Changes

Use Keychain to persist device ID across app reinstalls:

```swift
// Use a Keychain wrapper library like KeychainAccess
import KeychainAccess

let keychain = Keychain(service: "com.yourapp")

func getDeviceId() -> String {
    if let existing = keychain["deviceId"] {
        return existing
    }
    
    let newId = UUID().uuidString
    keychain["deviceId"] = newId
    return newId
}
```

### Issue: Verification Always Fails

Ensure you're comparing hash strings in lowercase:

```swift
// SDK already handles this, but for custom verification:
let computedHash = hash.lowercased()
let expectedHash = updateInfo.bundleHash.lowercased()
```

## SwiftUI Integration

For SwiftUI apps, create an `@EnvironmentObject`:

```swift
import SwiftUI
import OTAPlatformSDK

class OTAManager: ObservableObject {
    let client: OTAClient
    
    @Published var updateInfo: UpdateInfo?
    @Published var isChecking = false
    @Published var error: Error?
    
    init(client: OTAClient) {
        self.client = client
    }
    
    func checkForUpdate() {
        isChecking = true
        
        client.checkForUpdate { [weak self] result in
            DispatchQueue.main.async {
                self?.isChecking = false
                
                switch result {
                case .success(let info):
                    if info.updateAvailable {
                        self?.updateInfo = info
                    }
                case .failure(let error):
                    self?.error = error
                }
            }
        }
    }
}

@main
struct MyApp: App {
    @StateObject var otaManager: OTAManager
    
    init() {
        let config = OTAConfig(/* ... */)
        let client = OTAClient(config: config)
        _otaManager = StateObject(wrappedValue: OTAManager(client: client))
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(otaManager)
        }
    }
}
```

## Support

For issues, questions, or contributions, please visit:
- GitHub: https://github.com/your-org/ota-platform
- Documentation: https://docs.ota-platform.com

## License

MIT License
