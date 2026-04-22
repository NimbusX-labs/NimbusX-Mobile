import { cloudinaryService, CloudinaryResult } from '../cloudinaryService';
import { cacheService, StorageMode } from '../cacheService';

export interface MediaUploadResult {
  url: string;
  publicId?: string;
  resourceType?: string;
  size?: number;
  uploadedAt: number;
  mode: StorageMode;
}

export const storageService = {
  /**
   * Get the current storage mode (local vs cloud)
   */
  getStorageMode: async (): Promise<StorageMode> => {
    return cacheService.getStorageMode();
  },

  /**
   * Set the storage mode
   */
  setStorageMode: async (mode: StorageMode): Promise<void> => {
    return cacheService.setStorageMode(mode);
  },

  /**
   * Upload an avatar
   * Avatars are always uploaded to Cloudinary so everyone can see them
   */
  uploadAvatar: async (uid: string, fileUri: string, mimeType: string = 'image/jpeg'): Promise<string> => {
    const result = await cloudinaryService.uploadMedia(fileUri, mimeType, 'nimbusx/avatars');
    return result.url;
  },

  /**
   * Upload a status image
   * Always Cloudinary so others can see it
   */
  uploadStatusImage: async (uid: string, fileUri: string, mimeType: string = 'image/jpeg'): Promise<string> => {
    const result = await cloudinaryService.uploadMedia(fileUri, mimeType, 'nimbusx/status');
    return result.url;
  },

  /**
   * Upload chat media based on storage preference
   */
  uploadMedia: async (chatId: string, fileUri: string, mimeType: string, fileName: string): Promise<MediaUploadResult> => {
    const mode = await cacheService.getStorageMode();

    if (mode === 'local') {
      // Offline/local mode: cache it locally and return the local URI
      const cachedUri = await cacheService.cacheFile(fileUri, fileName);
      return {
        url: cachedUri,
        uploadedAt: Date.now(),
        mode: 'local'
      };
    } else {
      // Cloud mode: upload to Cloudinary
      const result = await cloudinaryService.uploadMedia(fileUri, mimeType, `nimbusx/media/${chatId}`);
      
      // Also cache it locally to save bandwidth on future reads
      await cacheService.cacheFile(fileUri, fileName);

      return {
        url: result.url,
        publicId: result.publicId,
        resourceType: result.resourceType,
        size: result.bytes,
        uploadedAt: result.uploadedAt,
        mode: 'cloud'
      };
    }
  },

  /**
   * Delete media from cloud if it exists
   */
  deleteMedia: async (publicId?: string, resourceType?: string): Promise<void> => {
    if (publicId) {
      await cloudinaryService.deleteMedia(publicId, resourceType);
    }
  }
};
