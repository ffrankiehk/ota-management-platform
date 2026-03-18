# @ota-platform/sdk

React Native OTA Update SDK for the OTA Management Platform.

## Installation

```bash
npm install @ota-platform/sdk
# or
yarn add @ota-platform/sdk
```

## Quick Start

### 1. Wrap your app with OTAProvider

```tsx
import { OTAProvider } from '@ota-platform/sdk';

const otaConfig = {
  apiUrl: 'https://your-ota-server.com',
  bundleId: 'com.yourcompany.app',
  platform: 'ios', // or 'android'
  appVersion: '1.0.0',
  currentBundleVersion: '1.0.0',
};

export default function App() {
  return (
    <OTAProvider config={otaConfig}>
      <YourApp />
    </OTAProvider>
  );
}
```

### 2. Add UpdatePrompt component

```tsx
import { UpdatePrompt } from '@ota-platform/sdk';

function YourApp() {
  const handleUpdateReady = (bundleData: ArrayBuffer) => {
    // Apply the update (implementation depends on your setup)
    console.log('Update ready, size:', bundleData.byteLength);
  };

  return (
    <View>
      {/* Your app content */}
      <UpdatePrompt onUpdateReady={handleUpdateReady} />
    </View>
  );
}
```

### 3. Or use the hook directly

```tsx
import { useOTA } from '@ota-platform/sdk';

function MyComponent() {
  const {
    state,
    updateInfo,
    progress,
    error,
    checkForUpdate,
    downloadUpdate,
  } = useOTA();

  return (
    <View>
      <Text>State: {state}</Text>
      {updateInfo?.available && (
        <Button title="Download Update" onPress={downloadUpdate} />
      )}
      {progress && <Text>Progress: {progress.percent}%</Text>}
    </View>
  );
}
```

## API Reference

### OTAConfig

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| apiUrl | string | Yes | Base URL of the OTA API server |
| bundleId | string | Yes | Application bundle ID |
| platform | 'ios' \| 'android' | Yes | Target platform |
| appVersion | string | Yes | Current app version |
| currentBundleVersion | string | Yes | Current bundle version |
| deviceId | string | No | Device unique identifier |
| autoCheck | boolean | No | Auto-check on mount (default: true) |

### useOTA / useOTAUpdate

Returns:

| Property | Type | Description |
|----------|------|-------------|
| state | OTAState | Current state: 'idle', 'checking', 'available', 'downloading', 'verifying', 'ready', 'error' |
| updateInfo | UpdateInfo | Update information when available |
| progress | DownloadProgress | Download progress |
| error | OTAError | Error information |
| bundleData | ArrayBuffer | Downloaded bundle data |
| checkForUpdate | () => Promise | Check for updates |
| downloadUpdate | () => Promise | Download the update |
| cancelDownload | () => void | Cancel ongoing download |
| reset | () => void | Reset state to idle |

### OTAClient

For advanced usage without React:

```typescript
import { OTAClient } from '@ota-platform/sdk';

const client = new OTAClient(config);

// Check for updates
const updateInfo = await client.checkForUpdate();

// Download bundle
const bundleData = await client.downloadBundle(
  updateInfo.bundleUrl,
  (progress) => console.log(progress.percent)
);

// Verify hash
const isValid = await client.verifyHash(bundleData, updateInfo.bundleHash);
```

## License

MIT
