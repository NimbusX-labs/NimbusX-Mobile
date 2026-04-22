import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
// Use require to prevent crash on startup if native module isn't linked yet
let RNFS: any = null;
try {
  RNFS = require('react-native-fs');
} catch (e) {
  console.warn('react-native-fs native module not linked yet');
}

const STORAGE_MODE_KEY = '@nimbusx_storage_mode';

export type StorageMode = 'local' | 'cloud';

export const cacheService = {
  /**
   * Get the global storage mode preference
   */
  async getStorageMode(): Promise<StorageMode> {
    try {
      const mode = await AsyncStorage.getItem(STORAGE_MODE_KEY);
      return (mode as StorageMode) || 'cloud'; // Default to cloud
    } catch {
      return 'cloud';
    }
  },

  /**
   * Set the global storage mode preference
   */
  async setStorageMode(mode: StorageMode): Promise<void> {
    await AsyncStorage.setItem(STORAGE_MODE_KEY, mode);
  },

  /**
   * Cache a file locally in the app's document directory
   * This ensures the file is available even if the original is deleted/moved
   */
  async cacheFile(sourceUri: string, filename: string): Promise<string> {
    try {
      if (!RNFS) {
        console.warn('react-native-fs not linked, skipping cache');
        return sourceUri;
      }
      
      // For content:// URIs on Android, we use copyFile
      // Dest path should be in DocumentDirectoryPath
      const destPath = `${RNFS.DocumentDirectoryPath}/${filename}`;
      
      // Check if already exists
      const exists = await RNFS.exists(destPath);
      if (!exists) {
        await RNFS.copyFile(sourceUri, destPath);
      }
      return `file://${destPath}`;
    } catch (error) {
      console.error('Failed to cache file:', error);
      // Fallback to the original URI
      return sourceUri;
    }
  }
};
