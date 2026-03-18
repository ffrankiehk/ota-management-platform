# OTA Platform Flutter SDK

Flutter SDK for OTA Platform - Over-the-Air update management for Flutter applications.

## Features

- ✅ Check for updates from OTA Platform API
- ✅ Download update bundles with progress tracking
- ✅ SHA256 integrity verification
- ✅ Status reporting (started, downloaded, verified, installed, failed)
- ✅ Cross-platform (iOS, Android, Web)
- ✅ Type-safe Dart API
- ✅ Automatic device info collection

## Installation

Add to your `pubspec.yaml`:

```yaml
dependencies:
  ota_platform_sdk: ^1.0.0
```

Then run:

```bash
flutter pub get
```

## Quick Start

### 1. Initialize OTA Client

```dart
import 'package:ota_platform_sdk/ota_platform_sdk.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:device_info_plus/device_info_plus.dart';

Future<OTAClient> createOTAClient() async {
  final packageInfo = await PackageInfo.fromPlatform();
  final deviceInfo = DeviceInfoPlugin();
  final deviceId = Platform.isAndroid
      ? (await deviceInfo.androidInfo).id
      : (await deviceInfo.iosInfo).identifierForVendor ?? '';

  final config = OTAConfig(
    apiBaseUrl: 'https://your-ota-api.com',
    bundleId: packageInfo.packageName,
    currentVersion: packageInfo.version,
    deviceId: deviceId,
    enableLogging: kDebugMode,
  );

  return OTAClient(config);
}
```

### 2. Check for Updates

```dart
final otaClient = await createOTAClient();

try {
  final updateInfo = await otaClient.checkForUpdate();
  
  if (updateInfo.updateAvailable) {
    print('New version available: ${updateInfo.latestVersion}');
    
    if (updateInfo.isMandatory) {
      // Force update
      await _downloadAndInstall(updateInfo);
    } else {
      // Show update dialog
      _showUpdateDialog(updateInfo);
    }
  } else {
    print('Already on latest version');
  }
} on OTAException catch (e) {
  print('Check update failed: $e');
}
```

### 3. Download with Progress

```dart
final filePath = await otaClient.downloadUpdate(
  updateInfo,
  onProgress: (progress) {
    print('Download progress: ${(progress.progress * 100).toInt()}%');
    setState(() {
      _downloadProgress = progress.progress;
    });
  },
);
```

### 4. Verify and Install

```dart
// Verify bundle
final isValid = await otaClient.verifyBundle(filePath, updateInfo.bundleHash);

if (isValid) {
  // Report verified
  await otaClient.reportStatus(updateInfo.releaseId, UpdateStatus.verified);
  
  // TODO: Install update (your implementation)
  // await installBundle(filePath);
  
  // Report installed
  await otaClient.reportStatus(updateInfo.releaseId, UpdateStatus.installed);
  
  // Restart app
  // Phoenix.rebirth(context);
} else {
  // Report failed
  await otaClient.reportStatus(
    updateInfo.releaseId,
    UpdateStatus.failed,
    errorMessage: 'Bundle verification failed',
  );
}
```

## Complete Example

```dart
import 'package:flutter/material.dart';
import 'package:ota_platform_sdk/ota_platform_sdk.dart';

class OTAUpdateScreen extends StatefulWidget {
  @override
  _OTAUpdateScreenState createState() => _OTAUpdateScreenState();
}

class _OTAUpdateScreenState extends State<OTAUpdateScreen> {
  late OTAClient _otaClient;
  UpdateInfo? _updateInfo;
  bool _isChecking = false;
  bool _isDownloading = false;
  double _downloadProgress = 0.0;

  @override
  void initState() {
    super.initState();
    _initOTA();
  }

  Future<void> _initOTA() async {
    _otaClient = await createOTAClient();
    _checkForUpdates();
  }

  Future<void> _checkForUpdates() async {
    setState(() => _isChecking = true);

    try {
      final updateInfo = await _otaClient.checkForUpdate();
      
      setState(() {
        _updateInfo = updateInfo;
        _isChecking = false;
      });

      if (updateInfo.updateAvailable) {
        if (updateInfo.isMandatory) {
          _downloadAndInstall();
        } else {
          _showUpdateDialog();
        }
      }
    } on OTAException catch (e) {
      setState(() => _isChecking = false);
      _showError('Check update failed: $e');
    }
  }

  void _showUpdateDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Update Available'),
        content: Text(
          'Version ${_updateInfo!.latestVersion} is available.\n\n'
          '${_updateInfo!.releaseNotes}',
        ),
        actions: [
          if (!_updateInfo!.isMandatory)
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('Later'),
            ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _downloadAndInstall();
            },
            child: Text('Update'),
          ),
        ],
      ),
    );
  }

  Future<void> _downloadAndInstall() async {
    if (_updateInfo == null) return;

    setState(() => _isDownloading = true);

    try {
      // Download
      final filePath = await _otaClient.downloadUpdate(
        _updateInfo!,
        onProgress: (progress) {
          setState(() => _downloadProgress = progress.progress);
        },
      );

      // Verify
      final isValid = await _otaClient.verifyBundle(
        filePath,
        _updateInfo!.bundleHash,
      );

      if (!isValid) {
        throw OTAException('Verification failed');
      }

      await _otaClient.reportStatus(
        _updateInfo!.releaseId,
        UpdateStatus.verified,
      );

      // TODO: Install update
      // await installBundle(filePath);

      await _otaClient.reportStatus(
        _updateInfo!.releaseId,
        UpdateStatus.installed,
      );

      // Show success and restart
      _showSuccess();
    } on OTAException catch (e) {
      setState(() => _isDownloading = false);
      _showError('Update failed: $e');
      
      if (_updateInfo != null) {
        await _otaClient.reportStatus(
          _updateInfo!.releaseId,
          UpdateStatus.failed,
          errorMessage: e.toString(),
        );
      }
    }
  }

  void _showSuccess() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: Text('Update Installed'),
        content: Text('The update has been installed successfully. '
            'The app will now restart.'),
        actions: [
          ElevatedButton(
            onPressed: () {
              // Restart app
              // Phoenix.rebirth(context);
            },
            child: Text('Restart'),
          ),
        ],
      ),
    );
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isChecking) {
      return Center(child: CircularProgressIndicator());
    }

    if (_isDownloading) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Downloading update... ${(_downloadProgress * 100).toInt()}%'),
            SizedBox(height: 8),
            LinearProgressIndicator(value: _downloadProgress),
          ],
        ),
      );
    }

    return Center(
      child: ElevatedButton(
        onPressed: _checkForUpdates,
        child: Text('Check for Updates'),
      ),
    );
  }

  @override
  void dispose() {
    _otaClient.dispose();
    super.dispose();
  }
}
```

## API Reference

### `OTAClient`

#### Constructor

```dart
OTAClient(OTAConfig config)
```

#### Methods

- `Future<UpdateInfo> checkForUpdate()` - Check for available updates
- `Future<String> downloadUpdate(UpdateInfo updateInfo, {void Function(DownloadProgress)? onProgress})` - Download update bundle
- `Future<bool> verifyBundle(String filePath, String expectedHash)` - Verify bundle integrity
- `Future<void> reportStatus(String releaseId, UpdateStatus status, {String? errorMessage, int? downloadTimeMs, int? installTimeMs})` - Report status to server
- `void dispose()` - Dispose resources

## Requirements

- Flutter >= 3.0.0
- Dart >= 3.0.0

## License

MIT
