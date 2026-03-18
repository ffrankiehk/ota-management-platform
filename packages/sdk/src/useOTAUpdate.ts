import { useState, useEffect, useCallback, useRef } from 'react';
import { OTAClient } from './OTAClient';
import { OTAConfig, UpdateInfo, DownloadProgress, OTAState, OTAError } from './types';

interface UseOTAUpdateResult {
  /** Current OTA state */
  state: OTAState;
  /** Update information (when available) */
  updateInfo: UpdateInfo | null;
  /** Download progress (when downloading) */
  progress: DownloadProgress | null;
  /** Error information (when error) */
  error: OTAError | null;
  /** Downloaded bundle data (when ready) */
  bundleData: ArrayBuffer | null;
  /** Check for updates manually */
  checkForUpdate: () => Promise<void>;
  /** Download the available update */
  downloadUpdate: () => Promise<void>;
  /** Cancel ongoing download */
  cancelDownload: () => void;
  /** Reset state to idle */
  reset: () => void;
}

/**
 * React Hook for OTA updates
 * @param config OTA configuration
 * @returns OTA update state and actions
 */
export function useOTAUpdate(config: OTAConfig): UseOTAUpdateResult {
  const [state, setState] = useState<OTAState>('idle');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [error, setError] = useState<OTAError | null>(null);
  const [bundleData, setBundleData] = useState<ArrayBuffer | null>(null);

  const clientRef = useRef<OTAClient | null>(null);

  // Initialize client
  useEffect(() => {
    clientRef.current = new OTAClient(config);

    // Auto-check on mount if enabled
    if (config.autoCheck !== false) {
      checkForUpdate();
    }

    return () => {
      clientRef.current?.cancelDownload();
    };
  }, [config.apiUrl, config.bundleId, config.platform, config.currentBundleVersion]);

  const checkForUpdate = useCallback(async () => {
    if (!clientRef.current) return;

    setState('checking');
    setError(null);

    try {
      const info = await clientRef.current.checkForUpdate();
      setUpdateInfo(info);
      const nextState = (info.action === 'update' || info.action === 'rollback' || info.available)
        ? 'available'
        : 'idle';
      setState(nextState);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError({ code: 'CHECK_FAILED', message });
      setState('error');
    }
  }, []);

  const downloadUpdate = useCallback(async () => {
    const downloadUrl = updateInfo?.downloadUrl ?? updateInfo?.bundleUrl;
    const bundleSize = updateInfo?.bundleSize;
    const bundleHash = updateInfo?.bundleHash;

    if (!clientRef.current || !downloadUrl) {
      setError({ code: 'NO_UPDATE', message: 'No update available to download' });
      setState('error');
      return;
    }

    setState('downloading');
    setProgress({ bytesDownloaded: 0, totalBytes: bundleSize || 0, percent: 0 });
    setError(null);

    try {
      const data = await clientRef.current.downloadBundle(
        downloadUrl,
        (p) => setProgress(p)
      );

      setState('verifying');

      // Verify hash if available
      if (bundleHash) {
        const isValid = await clientRef.current.verifyHash(data, bundleHash);
        if (!isValid) {
          throw new Error('Bundle hash verification failed');
        }
      }

      setBundleData(data);
      setState('ready');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Download failed';
      setError({ code: 'DOWNLOAD_FAILED', message });
      setState('error');
    }
  }, [updateInfo]);

  const cancelDownload = useCallback(() => {
    clientRef.current?.cancelDownload();
    setState('available');
    setProgress(null);
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setUpdateInfo(null);
    setProgress(null);
    setError(null);
    setBundleData(null);
  }, []);

  return {
    state,
    updateInfo,
    progress,
    error,
    bundleData,
    checkForUpdate,
    downloadUpdate,
    cancelDownload,
    reset,
  };
}
