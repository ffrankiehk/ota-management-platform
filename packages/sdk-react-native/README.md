# OTA Platform SDK for React Native

React Native SDK for the OTA Management Platform. Enables over-the-air updates for your React Native applications.

## Features

- ✅ Check for updates from OTA server
- ✅ Download updates with progress tracking
- ✅ SHA256 bundle verification
- ✅ Automatic status reporting
- ✅ Gradual rollout support
- ✅ TypeScript support
- ✅ iOS and Android support

## Installation

```bash
npm install @ota-platform/sdk-react-native react-native-fs
# or
yarn add @ota-platform/sdk-react-native react-native-fs
```

### Additional Setup

For iOS:
```bash
cd ios && pod install
```

For Android, no additional setup required (auto-linking).

## Quick Start

```typescript
import { OTAClient } from '@ota-platform/sdk-react-native';
import { Platform } from 'react-native';

// Initialize OTA Client
const otaClient = new OTAClient(
  {
    apiUrl: 'https://your-ota-server.com',
    bundleId: 'com.yourapp.bundle',
    platform: Platform.OS as 'ios' | 'android',
    currentVersion: '1.0.0',
    deviceId: 'unique-device-id', // Optional but recommended
  },
  {
    verifyHash: true,
    onProgress: (progress) => {
      console.log(`Download progress: ${(progress.progress * 100).toFixed(2)}%`);
    },
    onStatusChange: (status) => {
      console.log(`Update status: ${status}`);
    },
  }
);

// Check for updates
async function checkForUpdates() {
  try {
    const updateInfo = await otaClient.checkForUpdate();
    
    if (updateInfo.updateAvailable) {
      console.log('Update available:', updateInfo.latestVersion);
      
      // Perform update
      const result = await otaClient.performUpdate();
      
      if (result.success) {
        console.log('Update completed:', result.filePath);
        // Restart app or reload bundle
      } else {
        console.error('Update failed:', result.message);
      }
    } else {
      console.log('App is up to date');
    }
  } catch (error) {
    console.error('Update check failed:', error);
  }
}
```

## API Reference

### OTAClient

Main class for managing OTA updates.

#### Constructor

```typescript
new OTAClient(config: OTAConfig, options?: OTAClientOptions)
```

**OTAConfig:**
- `apiUrl` (string): OTA server URL
- `bundleId` (string): Application bundle identifier
- `platform` ('ios' | 'android'): Platform
- `currentVersion` (string): Current app version
- `deviceId` (string, optional): Unique device identifier
- `accountId` (string, optional): User account ID for rollout
- `timeout` (number, optional): Request timeout in ms (default: 30000)

**OTAClientOptions:**
- `verifyHash` (boolean, optional): Enable SHA256 verification (default: true)
- `onProgress` (function, optional): Download progress callback
- `onStatusChange` (function, optional): Status change callback

#### Methods

##### checkForUpdate()

Check if an update is available.

```typescript
const updateInfo = await otaClient.checkForUpdate();
```

Returns `UpdateInfo` object.

##### downloadUpdate(updateInfo)

Download an update bundle.

```typescript
const downloadResult = await otaClient.downloadUpdate(updateInfo);
```

Returns `DownloadResult` with file path and hash.

##### verifyBundle(downloadResult)

Verify downloaded bundle integrity.

```typescript
const isValid = await otaClient.verifyBundle(downloadResult);
```

Returns `boolean`.

##### performUpdate()

Complete update flow: check, download, verify.

```typescript
const result = await otaClient.performUpdate();
```

Returns `UpdateResult` object.

##### reportStatus(payload)

Report update status to server.

```typescript
await otaClient.reportStatus({
  bundleId: 'com.yourapp.bundle',
  platform: 'ios',
  deviceId: 'device-123',
  releaseId: 'release-456',
  status: 'installed',
  currentVersion: '1.0.0',
  targetVersion: '1.1.0',
});
```

## Advanced Usage

### Manual Update Flow

```typescript
// Step 1: Check for updates
const updateInfo = await otaClient.checkForUpdate();

if (!updateInfo.updateAvailable) {
  return;
}

// Step 2: Download update
const downloadResult = await otaClient.downloadUpdate(updateInfo);

// Step 3: Verify bundle
const isValid = await otaClient.verifyBundle(downloadResult);

if (!isValid) {
  throw new Error('Bundle verification failed');
}

// Step 4: Apply update (implementation depends on your app)
// For example, reload the bundle or restart the app
```

### Progress Tracking

```typescript
const otaClient = new OTAClient(config, {
  onProgress: (progress) => {
    const percent = (progress.progress * 100).toFixed(2);
    console.log(`Downloaded: ${percent}%`);
    console.log(`Bytes: ${progress.bytesWritten} / ${progress.contentLength}`);
  },
});
```

### Status Tracking

```typescript
const otaClient = new OTAClient(config, {
  onStatusChange: (status) => {
    switch (status) {
      case 'downloading':
        console.log('Downloading update...');
        break;
      case 'downloaded':
        console.log('Download complete');
        break;
      case 'verifying':
        console.log('Verifying bundle...');
        break;
      case 'verified':
        console.log('Verification successful');
        break;
      case 'installed':
        console.log('Update installed');
        break;
      case 'failed':
        console.error('Update failed');
        break;
    }
  },
});
```

### Handling Mandatory Updates

```typescript
const updateInfo = await otaClient.checkForUpdate();

if (updateInfo.updateAvailable && updateInfo.isMandatory) {
  // Show non-dismissible update dialog
  Alert.alert(
    'Update Required',
    'A mandatory update is available. Please update to continue.',
    [
      {
        text: 'Update Now',
        onPress: async () => {
          await otaClient.performUpdate();
          // Restart app
        },
      },
    ],
    { cancelable: false }
  );
}
```

## Types

All TypeScript types are exported from the package:

```typescript
import {
  OTAConfig,
  UpdateInfo,
  DownloadProgress,
  UpdateStatus,
  // ... etc
} from '@ota-platform/sdk-react-native';
```

## Error Handling

```typescript
try {
  const result = await otaClient.performUpdate();
  
  if (!result.success) {
    console.error('Update failed:', result.message);
    // Handle error
  }
} catch (error) {
  console.error('Update error:', error);
  // Handle exception
}
```

## Best Practices

1. **Check for updates on app start**
   ```typescript
   useEffect(() => {
     checkForUpdates();
   }, []);
   ```

2. **Use deviceId for gradual rollout**
   - Provide a unique device identifier
   - Enables server-side rollout control

3. **Always verify bundle hash**
   - Keep `verifyHash: true` in production
   - Ensures bundle integrity

4. **Handle network errors gracefully**
   - Wrap update checks in try-catch
   - Don't block app if update check fails

5. **Clean up old bundles**
   - SDK automatically keeps last 3 bundles
   - Prevents storage bloat

## Troubleshooting

### Download fails

- Check network connectivity
- Verify API URL is correct
- Check server logs for errors

### Verification fails

- Ensure bundle hash matches
- Check file wasn't corrupted during download
- Verify server is sending correct hash

### Updates not appearing

- Check rollout percentage on server
- Verify deviceId is being sent
- Check server logs for rollout logic

## License

MIT

## Support

For issues and questions, please open an issue on GitHub or contact support.
