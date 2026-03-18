import React, { createContext, useContext, ReactNode } from 'react';
import { useOTAUpdate } from './useOTAUpdate';
import { OTAConfig, UpdateInfo, DownloadProgress, OTAState, OTAError } from './types';

interface OTAContextValue {
  state: OTAState;
  updateInfo: UpdateInfo | null;
  progress: DownloadProgress | null;
  error: OTAError | null;
  bundleData: ArrayBuffer | null;
  checkForUpdate: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  cancelDownload: () => void;
  reset: () => void;
}

const OTAContext = createContext<OTAContextValue | null>(null);

interface OTAProviderProps {
  config: OTAConfig;
  children: ReactNode;
}

/**
 * OTA Provider Component
 * Wraps your app to provide OTA update functionality via context
 */
export function OTAProvider({ config, children }: OTAProviderProps) {
  const otaState = useOTAUpdate(config);

  return (
    <OTAContext.Provider value={otaState}>
      {children}
    </OTAContext.Provider>
  );
}

/**
 * Hook to access OTA context
 * Must be used within an OTAProvider
 */
export function useOTA(): OTAContextValue {
  const context = useContext(OTAContext);
  if (!context) {
    throw new Error('useOTA must be used within an OTAProvider');
  }
  return context;
}
