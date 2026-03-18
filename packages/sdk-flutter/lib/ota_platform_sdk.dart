library ota_platform_sdk;

import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:crypto/crypto.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:device_info_plus/device_info_plus.dart';

/// Configuration for OTA Client
class OTAConfig {
  final String apiBaseUrl;
  final String bundleId;
  final String platform;
  final String currentVersion;
  final String deviceId;
  final Duration timeout;
  final bool enableLogging;

  const OTAConfig({
    required this.apiBaseUrl,
    required this.bundleId,
    this.platform = 'flutter',
    required this.currentVersion,
    required this.deviceId,
    this.timeout = const Duration(seconds: 30),
    this.enableLogging = false,
  });
}

/// Information about an available update
class UpdateInfo {
  final bool updateAvailable;
  final String currentVersion;
  final String latestVersion;
  final String releaseId;
  final String downloadUrl;
  final String bundleHash;
  final int bundleSize;
  final String releaseNotes;
  final bool isMandatory;
  final String? minAppVersion;

  const UpdateInfo({
    required this.updateAvailable,
    required this.currentVersion,
    required this.latestVersion,
    required this.releaseId,
    required this.downloadUrl,
    required this.bundleHash,
    required this.bundleSize,
    required this.releaseNotes,
    required this.isMandatory,
    this.minAppVersion,
  });

  factory UpdateInfo.fromJson(Map<String, dynamic> json) {
    return UpdateInfo(
      updateAvailable: json['updateAvailable'] as bool,
      currentVersion: json['currentVersion'] as String,
      latestVersion: json['latestVersion'] as String,
      releaseId: json['releaseId'] as String? ?? '',
      downloadUrl: json['downloadUrl'] as String? ?? '',
      bundleHash: json['bundleHash'] as String? ?? '',
      bundleSize: (json['bundleSize'] as num?)?.toInt() ?? 0,
      releaseNotes: json['releaseNotes'] as String? ?? '',
      isMandatory: json['isMandatory'] as bool? ?? false,
      minAppVersion: json['minAppVersion'] as String?,
    );
  }
}

/// Status of an update operation
enum UpdateStatus {
  started('started'),
  downloaded('downloaded'),
  verified('verified'),
  installed('installed'),
  failed('failed');

  final String value;
  const UpdateStatus(this.value);
}

/// Download progress information
class DownloadProgress {
  final int bytesDownloaded;
  final int totalBytes;
  final double progress;

  const DownloadProgress({
    required this.bytesDownloaded,
    required this.totalBytes,
    required this.progress,
  });
}

/// Custom exception for OTA operations
class OTAException implements Exception {
  final String message;
  final dynamic cause;

  const OTAException(this.message, [this.cause]);

  @override
  String toString() => 'OTAException: $message${cause != null ? ' (Cause: $cause)' : ''}';
}

/// Main OTA Client
class OTAClient {
  final OTAConfig config;
  final http.Client _httpClient;

  OTAClient(this.config) : _httpClient = http.Client();

  /// Check for available updates
  Future<UpdateInfo> checkForUpdate() async {
    _log('Checking for updates...');

    try {
      final uri = Uri.parse('${config.apiBaseUrl}/api/v1/ota/check-update').replace(
        queryParameters: {
          'bundleId': config.bundleId,
          'platform': config.platform,
          'currentVersion': config.currentVersion,
          'deviceId': config.deviceId,
        },
      );

      final response = await _httpClient.get(uri).timeout(config.timeout);

      if (response.statusCode != 200) {
        throw OTAException('HTTP ${response.statusCode}: ${response.reasonPhrase}');
      }

      final json = jsonDecode(response.body) as Map<String, dynamic>;

      if (json['success'] != true) {
        throw OTAException(json['message'] as String? ?? 'Check update failed');
      }

      final data = json['data'] as Map<String, dynamic>?;
      if (data == null) {
        throw const OTAException('No data in response');
      }

      final updateInfo = UpdateInfo.fromJson(data);
      
      if (updateInfo.updateAvailable) {
        _log('Update available: ${updateInfo.latestVersion}');
      } else {
        _log('No update available');
      }

      return updateInfo;
    } catch (e) {
      _log('Check update error: $e');
      if (e is OTAException) rethrow;
      throw OTAException('Check update failed', e);
    }
  }

  /// Download update bundle with progress tracking
  Future<String> downloadUpdate(
    UpdateInfo updateInfo, {
    void Function(DownloadProgress)? onProgress,
  }) async {
    _log('Downloading update from ${updateInfo.downloadUrl}');

    try {
      // Report download started
      await reportStatus(updateInfo.releaseId, UpdateStatus.started);

      final request = http.Request('GET', Uri.parse(updateInfo.downloadUrl));
      final response = await _httpClient.send(request).timeout(config.timeout * 3);

      if (response.statusCode != 200) {
        throw OTAException('HTTP ${response.statusCode}: Download failed');
      }

      final contentLength = response.contentLength ?? updateInfo.bundleSize;
      int bytesDownloaded = 0;

      final directory = await getTemporaryDirectory();
      final downloadDir = Directory('${directory.path}/ota_updates');
      if (!await downloadDir.exists()) {
        await downloadDir.create(recursive: true);
      }

      final fileName = 'update_${updateInfo.latestVersion}.bundle';
      final file = File('${downloadDir.path}/$fileName');

      final sink = file.openWrite();

      await for (final chunk in response.stream) {
        sink.add(chunk);
        bytesDownloaded += chunk.length;

        if (onProgress != null) {
          final progress = bytesDownloaded / contentLength;
          onProgress(DownloadProgress(
            bytesDownloaded: bytesDownloaded,
            totalBytes: contentLength,
            progress: progress.clamp(0.0, 1.0),
          ));
        }
      }

      await sink.close();

      _log('Download complete: ${file.path}');

      // Report downloaded
      await reportStatus(updateInfo.releaseId, UpdateStatus.downloaded);

      return file.path;
    } catch (e) {
      _log('Download error: $e');
      
      // Report failed
      await reportStatus(
        updateInfo.releaseId,
        UpdateStatus.failed,
        errorMessage: e.toString(),
      );

      if (e is OTAException) rethrow;
      throw OTAException('Download failed', e);
    }
  }

  /// Verify bundle integrity using SHA256 hash
  Future<bool> verifyBundle(String filePath, String expectedHash) async {
    _log('Verifying bundle: $filePath');

    try {
      final file = File(filePath);
      if (!await file.exists()) {
        throw OTAException('File not found: $filePath');
      }

      final bytes = await file.readAsBytes();
      final hash = sha256.convert(bytes);
      final hashString = hash.toString();

      final isValid = hashString.toLowerCase() == expectedHash.toLowerCase();

      _log('Bundle hash: $hashString');
      _log('Expected hash: $expectedHash');
      _log('Verification: ${isValid ? "PASSED" : "FAILED"}');

      return isValid;
    } catch (e) {
      _log('Verification error: $e');
      return false;
    }
  }

  /// Report update status to server
  Future<void> reportStatus(
    String releaseId,
    UpdateStatus status, {
    String? errorMessage,
    int? downloadTimeMs,
    int? installTimeMs,
  }) async {
    _log('Reporting status: ${status.value}');

    try {
      final deviceInfo = await _getDeviceInfo();

      final body = jsonEncode({
        'deviceId': config.deviceId,
        'releaseId': releaseId,
        'status': status.value,
        if (errorMessage != null) 'errorMessage': errorMessage,
        if (downloadTimeMs != null) 'downloadTimeMs': downloadTimeMs,
        if (installTimeMs != null) 'installTimeMs': installTimeMs,
        'deviceInfo': deviceInfo,
      });

      final response = await _httpClient
          .post(
            Uri.parse('${config.apiBaseUrl}/api/v1/ota/report-status'),
            headers: {'Content-Type': 'application/json'},
            body: body,
          )
          .timeout(config.timeout);

      if (response.statusCode != 200) {
        throw OTAException('HTTP ${response.statusCode}: Report status failed');
      }

      final json = jsonDecode(response.body) as Map<String, dynamic>;

      if (json['success'] != true) {
        throw OTAException(json['message'] as String? ?? 'Report status failed');
      }

      _log('Status reported successfully: ${status.value}');
    } catch (e) {
      _log('Report status error: $e');
      if (e is OTAException) rethrow;
      throw OTAException('Report status failed', e);
    }
  }

  /// Get device information
  Future<Map<String, dynamic>> _getDeviceInfo() async {
    final deviceInfo = DeviceInfoPlugin();

    if (Platform.isAndroid) {
      final androidInfo = await deviceInfo.androidInfo;
      return {
        'manufacturer': androidInfo.manufacturer,
        'model': androidInfo.model,
        'osVersion': androidInfo.version.release,
        'appVersion': config.currentVersion,
      };
    } else if (Platform.isIOS) {
      final iosInfo = await deviceInfo.iosInfo;
      return {
        'manufacturer': 'Apple',
        'model': iosInfo.model,
        'osVersion': iosInfo.systemVersion,
        'appVersion': config.currentVersion,
      };
    } else {
      return {
        'manufacturer': 'Unknown',
        'model': Platform.operatingSystem,
        'osVersion': Platform.operatingSystemVersion,
        'appVersion': config.currentVersion,
      };
    }
  }

  /// Log message if logging is enabled
  void _log(String message) {
    if (config.enableLogging) {
      print('[OTA] $message');
    }
  }

  /// Dispose resources
  void dispose() {
    _httpClient.close();
  }
}
