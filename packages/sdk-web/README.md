# OTA Platform Web SDK

Web SDK for OTA Platform - Over-the-Air update management for Progressive Web Apps (PWA) and Single Page Applications (SPA).

## Features

- ✅ Check for updates from OTA Platform API
- ✅ Download update bundles with progress tracking
- ✅ SHA256 integrity verification (using Web Crypto API)
- ✅ Status reporting (started, downloaded, verified, installed, failed)
- ✅ Cache Storage integration for PWA
- ✅ TypeScript support
- ✅ Zero dependencies
- ✅ Works with Service Workers

## Installation

```bash
npm install @ota-platform/web-sdk
# or
yarn add @ota-platform/web-sdk
```

## Quick Start

### 1. Initialize OTA Client

```typescript
import OTAClient, { OTAConfig } from '@ota-platform/web-sdk';

const config: OTAConfig = {
  apiBaseUrl: 'https://your-ota-api.com',
  bundleId: 'com.yourcompany.webapp',
  currentVersion: '1.0.0', // Your app version
  deviceId: getUserDeviceId(), // Generate a unique device ID
  enableLogging: process.env.NODE_ENV === 'development',
};

const otaClient = new OTAClient(config);

function getUserDeviceId(): string {
  let deviceId = localStorage.getItem('ota-device-id');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('ota-device-id', deviceId);
  }
  return deviceId;
}
```

### 2. Check for Updates

```typescript
async function checkForUpdates() {
  try {
    const updateInfo = await otaClient.checkForUpdate();
    
    if (updateInfo.updateAvailable) {
      console.log('New version available:', updateInfo.latestVersion);
      
      if (updateInfo.isMandatory) {
        // Force update
        await downloadAndInstall(updateInfo);
      } else {
        // Show update notification
        showUpdateNotification(updateInfo);
      }
    } else {
      console.log('Already on latest version');
    }
  } catch (error) {
    console.error('Check update failed:', error);
  }
}
```

### 3. Download with Progress

```typescript
async function downloadUpdate(updateInfo) {
  const blob = await otaClient.downloadUpdate(
    updateInfo,
    (progress) => {
      console.log(`Download progress: ${Math.round(progress.progress * 100)}%`);
      updateProgressBar(progress.progress);
    }
  );
  
  return blob;
}
```

### 4. Verify and Install

```typescript
async function downloadAndInstall(updateInfo) {
  try {
    // Download
    const blob = await downloadUpdate(updateInfo);
    
    // Verify
    const isValid = await otaClient.verifyBundle(blob, updateInfo.bundleHash);
    
    if (!isValid) {
      throw new Error('Verification failed');
    }
    
    await otaClient.reportStatus(updateInfo.releaseId, UpdateStatus.VERIFIED);
    
    // Install
    await otaClient.installUpdate(blob, updateInfo);
    await otaClient.reportStatus(updateInfo.releaseId, UpdateStatus.INSTALLED);
    
    // Reload to apply
    if (confirm('Update installed. Reload now?')) {
      otaClient.reloadApp();
    }
  } catch (error) {
    console.error('Update failed:', error);
    
    await otaClient.reportStatus(
      updateInfo.releaseId,
      UpdateStatus.FAILED,
      error.message
    );
  }
}
```

## Complete Example (React)

```tsx
import React, { useEffect, useState } from 'react';
import OTAClient, { UpdateInfo, UpdateStatus } from '@ota-platform/web-sdk';

const otaClient = new OTAClient({
  apiBaseUrl: 'https://your-ota-api.com',
  bundleId: 'com.yourcompany.webapp',
  currentVersion: process.env.REACT_APP_VERSION || '1.0.0',
  deviceId: getUserDeviceId(),
  enableLogging: process.env.NODE_ENV === 'development',
});

function App() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    try {
      const info = await otaClient.checkForUpdate();
      
      if (info.updateAvailable) {
        setUpdateInfo(info);
        
        if (info.isMandatory) {
          downloadAndInstall(info);
        }
      }
    } catch (error) {
      console.error('Check update failed:', error);
    }
  };

  const downloadAndInstall = async (info: UpdateInfo) => {
    try {
      setDownloading(true);
      
      // Download
      const blob = await otaClient.downloadUpdate(info, (prog) => {
        setProgress(prog.progress);
      });
      
      // Verify
      const isValid = await otaClient.verifyBundle(blob, info.bundleHash);
      
      if (!isValid) {
        throw new Error('Verification failed');
      }
      
      await otaClient.reportStatus(info.releaseId, UpdateStatus.VERIFIED);
      
      // Install
      await otaClient.installUpdate(blob, info);
      await otaClient.reportStatus(info.releaseId, UpdateStatus.INSTALLED);
      
      // Reload
      if (window.confirm('Update installed successfully. Reload now?')) {
        otaClient.reloadApp();
      }
    } catch (error) {
      console.error('Update failed:', error);
      alert('Update failed: ' + error.message);
      
      await otaClient.reportStatus(
        info.releaseId,
        UpdateStatus.FAILED,
        error.message
      );
    } finally {
      setDownloading(false);
    }
  };

  if (downloading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <h2>Downloading Update...</h2>
        <progress value={progress} max={1} style={{ width: '100%' }} />
        <p>{Math.round(progress * 100)}%</p>
      </div>
    );
  }

  if (updateInfo && !updateInfo.isMandatory) {
    return (
      <div style={{ padding: 20 }}>
        <div style={{
          background: '#e3f2fd',
          padding: 15,
          borderRadius: 8,
          marginBottom: 20
        }}>
          <h3>Update Available</h3>
          <p>Version {updateInfo.latestVersion} is now available.</p>
          <p>{updateInfo.releaseNotes}</p>
          <button onClick={() => downloadAndInstall(updateInfo)}>
            Update Now
          </button>
          <button onClick={() => setUpdateInfo(null)}>
            Later
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>My Web App</h1>
      <button onClick={checkForUpdates}>Check for Updates</button>
    </div>
  );
}

function getUserDeviceId(): string {
  let deviceId = localStorage.getItem('ota-device-id');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('ota-device-id', deviceId);
  }
  return deviceId;
}

export default App;
```

## Service Worker Integration

For PWA apps, you can integrate with Service Worker:

```typescript
// service-worker.js
self.addEventListener('message', async (event) => {
  if (event.data.type === 'INSTALL_UPDATE') {
    const { blob, version } = event.data;
    
    // Cache the new bundle
    const cache = await caches.open('ota-updates');
    const response = new Response(blob);
    await cache.put(`/bundle-${version}`, response);
    
    // Notify clients
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'UPDATE_INSTALLED',
        version
      });
    });
  }
});
```

## API Reference

### `OTAClient`

#### Constructor

```typescript
new OTAClient(config: OTAConfig)
```

#### Methods

- `checkForUpdate(): Promise<UpdateInfo>` - Check for available updates
- `downloadUpdate(updateInfo: UpdateInfo, onProgress?: (progress: DownloadProgress) => void): Promise<Blob>` - Download update bundle
- `verifyBundle(blob: Blob, expectedHash: string): Promise<boolean>` - Verify bundle integrity
- `reportStatus(releaseId: string, status: UpdateStatus, errorMessage?: string): Promise<void>` - Report status to server
- `installUpdate(blob: Blob, updateInfo: UpdateInfo): Promise<void>` - Install update (cache in Service Worker)
- `reloadApp(): void` - Reload page to apply update

### Types

See TypeScript definitions for complete type information.

## Browser Support

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+
- All modern browsers with Web Crypto API and Cache Storage support

## License

MIT
