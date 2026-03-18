/**
 * OTA Platform SDK for React Native
 * @packageDocumentation
 */

export { OTAClient } from './OTAClient';
export * from './types';
export { calculateSHA256, verifyFileHash } from './utils/crypto';
export {
  getOTADirectory,
  ensureOTADirectory,
  getBundlePath,
  deleteBundleFile,
  cleanupOldBundles,
  getFileSize,
  fileExists,
} from './utils/storage';
