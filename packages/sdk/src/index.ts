// Core client
export { OTAClient } from './OTAClient';

// React hooks
export { useOTAUpdate as useOTA, useOTAUpdate } from './useOTAUpdate';

// React context/provider
export { OTAProvider } from './OTAProvider';

// UI components
export { UpdatePrompt } from './UpdatePrompt';

// Types
export * from './types';
export type {
  OTAConfig,
  UpdateInfo,
  DownloadProgress,
  OTAState,
  OTAError,
  CheckUpdateParams,
  CheckUpdateResponse,
} from './types';
