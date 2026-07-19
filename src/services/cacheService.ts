// Use require to prevent crash on startup if native module isn't linked yet
let RNFS: any = null;
try {
  RNFS = require('react-native-fs');
} catch {
  console.warn('react-native-fs native module not linked yet');
}

export const cacheService = {
  /**
   * Cache a file locally in the app's document directory structured by chat
   * This ensures the file is available even if the original is deleted/moved
   */
  async cacheFile(sourceUri: string, chatId: string, filename: string): Promise<string> {
    try {
      if (!RNFS) {
        console.warn('react-native-fs not linked, skipping cache');
        return sourceUri;
      }
      
      const mediaDir = `${RNFS.DocumentDirectoryPath}/media/${chatId}`;
      
      // Ensure the subdirectory exists
      const dirExists = await RNFS.exists(mediaDir);
      if (!dirExists) {
        await RNFS.mkdir(mediaDir);
      }
      
      const destPath = `${mediaDir}/${filename}`;

      const exists = await RNFS.exists(destPath);
      if (!exists) {
        let copySource = sourceUri;
        if (copySource.startsWith('content://')) {
          const tempPath = `${RNFS.CachesDirectoryPath}/cache_${Date.now()}_${filename}`;
          await RNFS.copyFile(copySource, tempPath);
          copySource = tempPath;
        } else if (copySource.startsWith('file://')) {
          copySource = decodeURIComponent(copySource.replace('file://', ''));
        }
        await RNFS.copyFile(copySource, destPath);
        if (sourceUri.startsWith('content://')) {
          try { await RNFS.unlink(copySource); } catch { /* ignore */ }
        }
      }
      return `file://${destPath}`;
    } catch (error) {
      console.error('Failed to cache file:', error);
      // Fallback to the original URI
      return sourceUri;
    }
  },

  /**
   * Clear local cache directory for a specific chat
   */
  async clearChatCache(chatId: string): Promise<void> {
    try {
      if (!RNFS) return;
      const mediaDir = `${RNFS.DocumentDirectoryPath}/media/${chatId}`;
      const exists = await RNFS.exists(mediaDir);
      if (exists) {
        await RNFS.unlink(mediaDir);
      }
    } catch (error) {
      console.error(`Failed to clear cache for chat ${chatId}:`, error);
    }
  }
};
