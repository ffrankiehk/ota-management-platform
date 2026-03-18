# Test OTA App (React Native)

Test application for validating the OTA Management Platform functionality.

## Features

- ✅ Check for updates
- ✅ Download progress tracking
- ✅ Hash verification
- ✅ Status reporting
- ✅ Environment configuration
- ✅ Detailed logging
- ✅ Error handling

## Prerequisites

- Node.js >= 18
- React Native development environment setup
- Android Studio (for Android) or Xcode (for iOS)

## Installation

```bash
cd test-app-rn
npm install
```

## Running

### Android
```bash
npm run android
```

### iOS
```bash
npm run ios
```

## Configuration

Edit the `OTA_CONFIG` in `App.tsx` to point to your OTA server:

```typescript
const OTA_CONFIG = {
  apiUrl: 'http://localhost:3000',  // Your OTA API URL
  bundleId: 'com.test.otaapp',
  platform: 'android',  // or 'ios'
  appVersion: '1.0.0',
  currentBundleVersion: '1.0.0',
  deviceId: 'test-device-001',
  enableReporting: true,
};
```

## Testing Workflow

1. **Start OTA Backend**
   ```bash
   cd ota-management-platform
   npm run dev:infrastructure
   npm run dev:api
   ```

2. **Create a test release** via Dashboard or API

3. **Run Test App** and click "Check for Update"

4. **Monitor Logs** in the app for detailed information

5. **Verify Status Reports** in the backend database

## Expected Behavior

- **No Update**: Shows "You are on the latest version"
- **Update Available**: Shows version, size, release notes
- **Download**: Progress bar updates, hash verification runs
- **Success**: State changes to "ready", bundle data available
- **Error**: Detailed error message in logs

## Troubleshooting

### Cannot connect to server
- Ensure backend is running on correct port
- Update `apiUrl` in config
- Check network connectivity (use real IP for device testing, not localhost)

### Update not found
- Verify application exists in database with correct `bundle_id` and `platform`
- Ensure release status is "active"
- Check version comparison logic

### Download fails
- Verify `bundle_url` is accessible
- Check file storage (MinIO/S3) configuration
- Review backend logs for errors

## Development

The app uses `@ota-platform/sdk` from the local monorepo. Changes to the SDK will require rebuilding:

```bash
cd ../packages/sdk
npm run build
cd ../../test-app-rn
npm install  # Re-link local package
```
