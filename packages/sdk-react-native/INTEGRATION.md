# Integration Guide - OTA SDK for React Native

Complete guide for integrating the OTA SDK into your React Native application.

## Table of Contents

1. [Installation](#installation)
2. [Basic Setup](#basic-setup)
3. [Integration with AMC App](#integration-with-amc-app)
4. [Update Strategies](#update-strategies)
5. [Testing](#testing)
6. [Production Deployment](#production-deployment)

---

## Installation

### 1. Install Dependencies

```bash
cd your-react-native-app
npm install @ota-platform/sdk-react-native react-native-fs
```

### 2. Link Native Modules

For React Native 0.60+, auto-linking should work automatically.

**iOS:**
```bash
cd ios && pod install && cd ..
```

**Android:**
No additional steps required (auto-linking).

---

## Basic Setup

### 1. Create OTA Service

Create a new file `src/services/ota/otaService.ts`:

```typescript
import { OTAClient } from '@ota-platform/sdk-react-native';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

// OTA Configuration
const OTA_CONFIG = {
  apiUrl: __DEV__ 
    ? 'http://localhost:3000' 
    : 'https://ota.yourcompany.com',
  bundleId: 'com.yourapp.bundle',
  platform: Platform.OS as 'ios' | 'android',
  currentVersion: '1.0.0', // Get from package.json or app config
};

// Create OTA Client instance
export const otaClient = new OTAClient(
  {
    ...OTA_CONFIG,
    deviceId: DeviceInfo.getUniqueId(),
  },
  {
    verifyHash: true,
    onProgress: (progress) => {
      console.log(`OTA Download: ${(progress.progress * 100).toFixed(1)}%`);
    },
    onStatusChange: (status) => {
      console.log(`OTA Status: ${status}`);
    },
  }
);

// Check for updates
export async function checkForUpdates() {
  try {
    const updateInfo = await otaClient.checkForUpdate();
    return updateInfo;
  } catch (error) {
    console.error('Failed to check for updates:', error);
    return null;
  }
}

// Perform update
export async function performUpdate() {
  try {
    const result = await otaClient.performUpdate();
    return result;
  } catch (error) {
    console.error('Failed to perform update:', error);
    return { success: false, message: error.message };
  }
}
```

### 2. Add Update Check on App Start

In your `App.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { checkForUpdates, performUpdate } from './services/ota/otaService';

export default function App() {
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  useEffect(() => {
    checkForUpdatesOnStart();
  }, []);

  async function checkForUpdatesOnStart() {
    if (isCheckingUpdate) return;
    
    setIsCheckingUpdate(true);
    
    try {
      const updateInfo = await checkForUpdates();
      
      if (updateInfo?.updateAvailable) {
        handleUpdateAvailable(updateInfo);
      }
    } catch (error) {
      console.error('Update check failed:', error);
    } finally {
      setIsCheckingUpdate(false);
    }
  }

  function handleUpdateAvailable(updateInfo) {
    if (updateInfo.isMandatory) {
      // Mandatory update - non-dismissible
      Alert.alert(
        'Update Required',
        `Version ${updateInfo.latestVersion} is available. Please update to continue.`,
        [
          {
            text: 'Update Now',
            onPress: async () => {
              const result = await performUpdate();
              if (result.success) {
                // Reload app or restart
                Alert.alert('Success', 'Update installed. Please restart the app.');
              }
            },
          },
        ],
        { cancelable: false }
      );
    } else {
      // Optional update
      Alert.alert(
        'Update Available',
        `Version ${updateInfo.latestVersion} is available.\n\n${updateInfo.releaseNotes || ''}`,
        [
          {
            text: 'Later',
            style: 'cancel',
          },
          {
            text: 'Update',
            onPress: async () => {
              const result = await performUpdate();
              if (result.success) {
                Alert.alert('Success', 'Update installed successfully.');
              }
            },
          },
        ]
      );
    }
  }

  return (
    // Your app content
  );
}
```

---

## Integration with AMC App

### 1. Install in AMC App

```bash
cd c:/xampp-AMC/htdocs/AMC-app/native-app/AMC-app
npm install @ota-platform/sdk-react-native react-native-fs react-native-device-info
```

### 2. Create OTA Service

Create `src/services/ota/otaService.ts`:

```typescript
import { OTAClient } from '@ota-platform/sdk-react-native';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OTA_CONFIG = {
  apiUrl: __DEV__ 
    ? 'http://192.168.1.100:3000' // Your local OTA server
    : 'https://ota.aberdeenmarinaclub.com',
  bundleId: 'com.aberdeenmarinaclub.amc',
  platform: Platform.OS as 'ios' | 'android',
  currentVersion: '1.0.0',
};

export const otaClient = new OTAClient(
  {
    ...OTA_CONFIG,
    deviceId: DeviceInfo.getUniqueId(),
  },
  {
    verifyHash: true,
    onProgress: (progress) => {
      // You can emit events or update state here
      console.log(`Download: ${(progress.progress * 100).toFixed(1)}%`);
    },
    onStatusChange: (status) => {
      console.log(`Status: ${status}`);
    },
  }
);

// Track last update check
const LAST_CHECK_KEY = 'ota_last_check';

export async function shouldCheckForUpdate(): Promise<boolean> {
  try {
    const lastCheck = await AsyncStorage.getItem(LAST_CHECK_KEY);
    if (!lastCheck) return true;
    
    const lastCheckTime = new Date(lastCheck).getTime();
    const now = Date.now();
    const hoursSinceLastCheck = (now - lastCheckTime) / (1000 * 60 * 60);
    
    // Check every 24 hours
    return hoursSinceLastCheck >= 24;
  } catch {
    return true;
  }
}

export async function checkForUpdates() {
  try {
    const updateInfo = await otaClient.checkForUpdate();
    await AsyncStorage.setItem(LAST_CHECK_KEY, new Date().toISOString());
    return updateInfo;
  } catch (error) {
    console.error('Failed to check for updates:', error);
    return null;
  }
}

export async function performUpdate() {
  return await otaClient.performUpdate();
}
```

### 3. Add to App.tsx

```typescript
import { useEffect } from 'react';
import { shouldCheckForUpdate, checkForUpdates } from './services/ota/otaService';

export default function App() {
  useEffect(() => {
    checkForUpdatesIfNeeded();
  }, []);

  async function checkForUpdatesIfNeeded() {
    const should = await shouldCheckForUpdate();
    if (should) {
      const updateInfo = await checkForUpdates();
      if (updateInfo?.updateAvailable) {
        // Handle update UI
      }
    }
  }

  // ... rest of your app
}
```

---

## Update Strategies

### Strategy 1: Silent Background Update

Download update in background, apply on next app start.

```typescript
async function silentUpdate() {
  const updateInfo = await checkForUpdates();
  
  if (updateInfo?.updateAvailable && !updateInfo.isMandatory) {
    // Download silently
    await performUpdate();
    // Don't notify user, will apply on next restart
  }
}
```

### Strategy 2: User Prompt

Ask user before downloading.

```typescript
async function promptUpdate(updateInfo) {
  Alert.alert(
    'Update Available',
    `Version ${updateInfo.latestVersion}\n\n${updateInfo.releaseNotes}`,
    [
      { text: 'Later', style: 'cancel' },
      { 
        text: 'Update', 
        onPress: async () => {
          await performUpdate();
          // Restart or reload
        }
      },
    ]
  );
}
```

### Strategy 3: Mandatory Update

Block app usage until updated.

```typescript
async function mandatoryUpdate(updateInfo) {
  Alert.alert(
    'Update Required',
    'Please update to continue using the app.',
    [
      {
        text: 'Update Now',
        onPress: async () => {
          const result = await performUpdate();
          if (result.success) {
            // Restart app
            RNRestart.Restart();
          }
        },
      },
    ],
    { cancelable: false }
  );
}
```

---

## Testing

### 1. Test with Local OTA Server

Start your OTA backend:

```bash
cd c:/xampp-AMC/htdocs/ota-management-platform/packages/api
npm run dev
```

### 2. Create Test Release

1. Open OTA Dashboard: http://localhost:3001
2. Create an application
3. Upload a test bundle
4. Activate the release

### 3. Test in App

```typescript
// Add test button in development
if (__DEV__) {
  <Button 
    title="Check for Updates" 
    onPress={async () => {
      const updateInfo = await checkForUpdates();
      console.log('Update Info:', updateInfo);
    }}
  />
}
```

---

## Production Deployment

### 1. Environment Configuration

```typescript
const OTA_CONFIG = {
  apiUrl: __DEV__ 
    ? 'http://localhost:3000' 
    : 'https://ota.yourcompany.com',
  // ... other config
};
```

### 2. Security Considerations

- ✅ Always use HTTPS in production
- ✅ Enable hash verification
- ✅ Use device ID for rollout control
- ✅ Implement rate limiting on server

### 3. Monitoring

```typescript
import analytics from '@react-native-firebase/analytics';

const otaClient = new OTAClient(config, {
  onStatusChange: (status) => {
    analytics().logEvent('ota_status_change', { status });
  },
});
```

### 4. Error Handling

```typescript
async function safeCheckForUpdates() {
  try {
    return await checkForUpdates();
  } catch (error) {
    // Log to error tracking service
    Sentry.captureException(error);
    return null;
  }
}
```

---

## Troubleshooting

### Issue: Updates not detected

**Solution:**
- Check API URL is correct
- Verify bundle ID matches
- Check server logs
- Ensure release is activated

### Issue: Download fails

**Solution:**
- Check network connectivity
- Verify download URL is accessible
- Check file permissions
- Review server logs

### Issue: Verification fails

**Solution:**
- Ensure bundle hash is correct on server
- Check file wasn't corrupted
- Verify SHA256 calculation

---

## Next Steps

1. ✅ Install SDK
2. ✅ Configure OTA service
3. ✅ Add update checks
4. ✅ Test with local server
5. ✅ Deploy to production

For more information, see the [README](./README.md).
