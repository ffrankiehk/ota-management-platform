import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useOTA } from './OTAProvider';

interface UpdatePromptProps {
  /** Title text */
  title?: string;
  /** Custom render function for the prompt content */
  renderContent?: () => React.ReactNode;
  /** Called when user dismisses the prompt (only for non-mandatory updates) */
  onDismiss?: () => void;
  /** Called when update is ready to apply */
  onUpdateReady?: (bundleData: ArrayBuffer) => void;
}

/**
 * Update Prompt Component
 * Shows a modal when an update is available
 */
export function UpdatePrompt({
  title = 'Update Available',
  renderContent,
  onDismiss,
  onUpdateReady,
}: UpdatePromptProps) {
  const {
    state,
    updateInfo,
    progress,
    error,
    bundleData,
    downloadUpdate,
    cancelDownload,
    reset,
  } = useOTA();

  // Call onUpdateReady when bundle is ready
  React.useEffect(() => {
    if (state === 'ready' && bundleData && onUpdateReady) {
      onUpdateReady(bundleData);
    }
  }, [state, bundleData, onUpdateReady]);

  const isVisible = state === 'available' || state === 'downloading' || state === 'verifying';

  if (!isVisible || !updateInfo) {
    return null;
  }

  const handleDismiss = () => {
    if (!updateInfo.isMandatory && onDismiss) {
      reset();
      onDismiss();
    }
  };

  const handleDownload = () => {
    downloadUpdate();
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{title}</Text>

          {renderContent ? (
            renderContent()
          ) : (
            <>
              <Text style={styles.version}>
                Version {updateInfo.version}
              </Text>

              {updateInfo.releaseNotes && (
                <Text style={styles.notes}>{updateInfo.releaseNotes}</Text>
              )}

              {updateInfo.isMandatory && (
                <Text style={styles.mandatory}>This update is required</Text>
              )}
            </>
          )}

          {state === 'downloading' && progress && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${progress.percent}%` }]}
                />
              </View>
              <Text style={styles.progressText}>{progress.percent}%</Text>
            </View>
          )}

          {state === 'verifying' && (
            <View style={styles.verifyingContainer}>
              <ActivityIndicator size="small" color="#1890ff" />
              <Text style={styles.verifyingText}>Verifying...</Text>
            </View>
          )}

          {error && (
            <Text style={styles.error}>{error.message}</Text>
          )}

          <View style={styles.buttons}>
            {state === 'available' && (
              <>
                {!updateInfo.isMandatory && (
                  <TouchableOpacity
                    style={[styles.button, styles.buttonSecondary]}
                    onPress={handleDismiss}
                  >
                    <Text style={styles.buttonTextSecondary}>Later</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary]}
                  onPress={handleDownload}
                >
                  <Text style={styles.buttonTextPrimary}>Update Now</Text>
                </TouchableOpacity>
              </>
            )}

            {state === 'downloading' && (
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={cancelDownload}
              >
                <Text style={styles.buttonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  version: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  notes: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  mandatory: {
    fontSize: 12,
    color: '#ff4d4f',
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  progressContainer: {
    marginVertical: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e8e8e8',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1890ff',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  verifyingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  verifyingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  error: {
    fontSize: 12,
    color: '#ff4d4f',
    textAlign: 'center',
    marginBottom: 12,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
  },
  buttonPrimary: {
    backgroundColor: '#1890ff',
  },
  buttonSecondary: {
    backgroundColor: '#f0f0f0',
  },
  buttonTextPrimary: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonTextSecondary: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
