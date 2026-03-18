/**
 * Crypto utilities for bundle verification
 */

import { Platform } from 'react-native';

/**
 * Calculate SHA256 hash of a file
 * @param filePath - Path to the file
 * @returns Promise<string> - SHA256 hash in hex format
 */
export async function calculateSHA256(filePath: string): Promise<string> {
  try {
    // For React Native, we'll use react-native-fs which has hash support
    const RNFS = require('react-native-fs');
    
    // Read file and calculate hash
    const hash = await RNFS.hash(filePath, 'sha256');
    return hash.toLowerCase();
  } catch (error) {
    throw new Error(`Failed to calculate SHA256: ${error}`);
  }
}

/**
 * Verify file hash matches expected hash
 * @param filePath - Path to the file
 * @param expectedHash - Expected SHA256 hash
 * @returns Promise<boolean> - True if hash matches
 */
export async function verifyFileHash(
  filePath: string,
  expectedHash: string
): Promise<boolean> {
  try {
    const actualHash = await calculateSHA256(filePath);
    return actualHash === expectedHash.toLowerCase();
  } catch (error) {
    console.error('Hash verification failed:', error);
    return false;
  }
}

/**
 * Generate a simple hash for device ID (for rollout bucketing)
 * @param input - Input string
 * @returns number - Hash value
 */
export function simpleHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}
