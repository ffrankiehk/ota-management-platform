import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { OTAProvider, useOTA } from '@ota-platform/sdk';

const OTA_CONFIG = {
  apiUrl: 'http://localhost:3000',
  bundleId: 'com.test.otaapp',
  platform: 'android' as const,
  appVersion: '1.0.0',
  currentBundleVersion: '1.0.0',
  deviceId: 'test-device-001',
  enableReporting: true,
};

function TestOTAScreen() {
  const {
    state,
    updateInfo,
    progress,
    error,
    checkForUpdate,
    downloadUpdate,
    cancelDownload,
    reset,
  } = useOTA();

  const [logs, setLogs] = useState<string[]>([]);
  const [apiUrl, setApiUrl] = useState(OTA_CONFIG.apiUrl);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 50));
  };

  useEffect(() => {
    addLog('OTA Test App initialized');
  }, []);

  useEffect(() => {
    addLog(`State changed: ${state}`);
  }, [state]);

  useEffect(() => {
    if (error) {
      addLog(`ERROR: ${error.code} - ${error.message}`);
    }
  }, [error]);

  useEffect(() => {
    if (updateInfo?.available) {
      addLog(`Update available: ${updateInfo.version}`);
      addLog(`Bundle size: ${(updateInfo.bundleSize || 0) / 1024}KB`);
      addLog(`Mandatory: ${updateInfo.isMandatory ? 'Yes' : 'No'}`);
      if (updateInfo.releaseNotes) {
        addLog(`Notes: ${updateInfo.releaseNotes}`);
      }
    }
  }, [updateInfo]);

  const handleCheckUpdate = async () => {
    addLog('Checking for updates...');
    try {
      await checkForUpdate();
      addLog('Check complete');
    } catch (err: any) {
      addLog(`Check failed: ${err.message}`);
    }
  };

  const handleDownload = async () => {
    addLog('Starting download...');
    try {
      await downloadUpdate();
      addLog('Download complete');
    } catch (err: any) {
      addLog(`Download failed: ${err.message}`);
    }
  };

  const handleCancel = () => {
    addLog('Cancelling download...');
    cancelDownload();
  };

  const handleReset = () => {
    addLog('Resetting state...');
    reset();
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  const handleCopyLogs = () => {
    const logsText = logs.join('\n');
    Alert.alert('Logs', logsText);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>OTA Test App</Text>
        <Text style={styles.subtitle}>React Native</Text>
      </View>

      <View style={styles.configSection}>
        <Text style={styles.sectionTitle}>Configuration</Text>
        <Text style={styles.configText}>Bundle ID: {OTA_CONFIG.bundleId}</Text>
        <Text style={styles.configText}>
          Current Version: {OTA_CONFIG.currentBundleVersion}
        </Text>
        <Text style={styles.configText}>
          Device ID: {OTA_CONFIG.deviceId}
        </Text>
        <View style={styles.urlInput}>
          <Text style={styles.label}>API URL:</Text>
          <TextInput
            style={styles.input}
            value={apiUrl}
            onChangeText={setApiUrl}
            placeholder="http://localhost:3000"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      <View style={styles.statusSection}>
        <Text style={styles.sectionTitle}>Status</Text>
        <View style={styles.statusRow}>
          <Text style={styles.label}>State:</Text>
          <Text style={[styles.statusValue, getStateColor(state)]}>
            {state.toUpperCase()}
          </Text>
        </View>
        {updateInfo?.available && (
          <>
            <View style={styles.statusRow}>
              <Text style={styles.label}>Latest Version:</Text>
              <Text style={styles.statusValue}>{updateInfo.version}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.label}>Size:</Text>
              <Text style={styles.statusValue}>
                {((updateInfo.bundleSize || 0) / 1024).toFixed(2)} KB
              </Text>
            </View>
          </>
        )}
        {progress && (
          <View style={styles.progressSection}>
            <Text style={styles.label}>
              Download Progress: {progress.percent}%
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress.percent}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {(progress.bytesDownloaded / 1024).toFixed(2)} /{' '}
              {(progress.totalBytes / 1024).toFixed(2)} KB
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actionsSection}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleCheckUpdate}
          disabled={state === 'checking'}>
          {state === 'checking' ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Check for Update</Text>
          )}
        </TouchableOpacity>

        {updateInfo?.available && (
          <TouchableOpacity
            style={[styles.button, styles.successButton]}
            onPress={handleDownload}
            disabled={state === 'downloading' || state === 'verifying'}>
            {state === 'downloading' || state === 'verifying' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Download Update</Text>
            )}
          </TouchableOpacity>
        )}

        {state === 'downloading' && (
          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={handleCancel}>
            <Text style={styles.buttonText}>Cancel Download</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleReset}>
          <Text style={styles.buttonTextDark}>Reset</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.logsSection}>
        <View style={styles.logsHeader}>
          <Text style={styles.sectionTitle}>Logs</Text>
          <View style={styles.logsActions}>
            <TouchableOpacity onPress={handleCopyLogs}>
              <Text style={styles.logsAction}>Copy</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleClearLogs}>
              <Text style={styles.logsAction}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView style={styles.logsScroll}>
          {logs.map((log, index) => (
            <Text key={index} style={styles.logText}>
              {log}
            </Text>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function getStateColor(state: string) {
  switch (state) {
    case 'error':
      return { color: '#dc2626' };
    case 'ready':
      return { color: '#16a34a' };
    case 'downloading':
    case 'checking':
    case 'verifying':
      return { color: '#2563eb' };
    case 'available':
      return { color: '#ea580c' };
    default:
      return { color: '#6b7280' };
  }
}

export default function App() {
  return (
    <OTAProvider config={OTA_CONFIG}>
      <TestOTAScreen />
    </OTAProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#2563eb',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#dbeafe',
    marginTop: 4,
  },
  configSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statusSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  actionsSection: {
    padding: 16,
    gap: 12,
  },
  logsSection: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 8,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  configText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  urlInput: {
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    color: '#111827',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressSection: {
    marginTop: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'right',
  },
  button: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
  },
  successButton: {
    backgroundColor: '#16a34a',
  },
  dangerButton: {
    backgroundColor: '#dc2626',
  },
  secondaryButton: {
    backgroundColor: '#e5e7eb',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextDark: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  logsActions: {
    flexDirection: 'row',
    gap: 16,
  },
  logsAction: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '500',
  },
  logsScroll: {
    flex: 1,
    padding: 12,
  },
  logText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#374151',
    marginBottom: 4,
  },
});
