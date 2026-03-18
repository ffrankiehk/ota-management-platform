/**
 * Storage utilities for file management
 */

import { Platform } from 'react-native';

const RNFS = require('react-native-fs');

/**
 * Get the OTA storage directory path
 */
export function getOTADirectory(): string {
  const baseDir = Platform.OS === 'ios' 
    ? RNFS.DocumentDirectoryPath 
    : RNFS.DocumentDirectoryPath;
  
  return `${baseDir}/ota-updates`;
}

/**
 * Ensure OTA directory exists
 */
export async function ensureOTADirectory(): Promise<string> {
  const otaDir = getOTADirectory();
  
  const exists = await RNFS.exists(otaDir);
  if (!exists) {
    await RNFS.mkdir(otaDir);
  }
  
  return otaDir;
}

/**
 * Get path for a specific bundle file
 */
export function getBundlePath(releaseId: string, fileName: string = 'bundle.js'): string {
  return `${getOTADirectory()}/${releaseId}_${fileName}`;
}

/**
 * Delete a bundle file
 */
export async function deleteBundleFile(filePath: string): Promise<void> {
  try {
    const exists = await RNFS.exists(filePath);
    if (exists) {
      await RNFS.unlink(filePath);
    }
  } catch (error) {
    console.error('Failed to delete bundle file:', error);
  }
}

/**
 * Clean up old bundle files (keep only the latest N)
 */
export async function cleanupOldBundles(keepCount: number = 3): Promise<void> {
  try {
    const otaDir = getOTADirectory();
    const exists = await RNFS.exists(otaDir);
    
    if (!exists) {
      return;
    }
    
    const files = await RNFS.readDir(otaDir);
    
    // Sort by modification time (newest first)
    const sortedFiles = files.sort((a: any, b: any) => {
      return new Date(b.mtime).getTime() - new Date(a.mtime).getTime();
    });
    
    // Delete files beyond keepCount
    for (let i = keepCount; i < sortedFiles.length; i++) {
      await RNFS.unlink(sortedFiles[i].path);
    }
  } catch (error) {
    console.error('Failed to cleanup old bundles:', error);
  }
}

/**
 * Get file size
 */
export async function getFileSize(filePath: string): Promise<number> {
  try {
    const stat = await RNFS.stat(filePath);
    return parseInt(stat.size, 10);
  } catch (error) {
    return 0;
  }
}

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    return await RNFS.exists(filePath);
  } catch (error) {
    return false;
  }
}
