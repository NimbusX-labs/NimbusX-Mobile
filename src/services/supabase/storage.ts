import RNFS from 'react-native-fs';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../../config/supabase';
import { cacheService } from '../cacheService';

export interface MediaUploadResult {
  url: string;
  mediaPath?: string;
  publicId?: string; // alias for mediaPath to match old structure
  resourceType?: string;
  size?: number;
  uploadedAt: number;
  mode: 'cloud';
}

const resolveUriToLocalPath = async (uri: string, mimeType: string): Promise<{ localPath: string; isTemp: boolean }> => {
  if (uri.startsWith('content://')) {
    const ext = mimeType.split('/')[1] || 'tmp';
    const tempFileName = `temp_${Date.now()}.${ext}`;
    const tempPath = `${RNFS.CachesDirectoryPath}/${tempFileName}`;
    await RNFS.copyFile(uri, tempPath);
    return { localPath: tempPath, isTemp: true };
  }
  
  let cleanPath = uri;
  if (cleanPath.startsWith('file://')) {
    cleanPath = decodeURIComponent(cleanPath.replace('file://', ''));
  }
  return { localPath: cleanPath, isTemp: false };
};

const uploadToBucket = async (bucket: string, path: string, fileUri: string, mimeType: string) => {
  const { localPath, isTemp } = await resolveUriToLocalPath(fileUri, mimeType);

  try {
    // Read file as base64
    const base64 = await RNFS.readFile(localPath, 'base64');
    const arrayBuffer = decode(base64);

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, arrayBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.error(`Upload to bucket ${bucket} failed:`, error);
      throw error;
    }
    return data;
  } finally {
    if (isTemp) {
      try {
        await RNFS.unlink(localPath);
      } catch (err) {
        console.warn('Failed to delete temp file:', err);
      }
    }
  }
};

export const storageService = {
  /**
   * Upload an avatar
   */
  uploadAvatar: async (uid: string, fileUri: string, mimeType: string = 'image/jpeg'): Promise<string> => {
    const fileName = `avatar_${Date.now()}.jpg`;
    const path = `${uid}/${fileName}`;
    await uploadToBucket('avatars', path, fileUri, mimeType);
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return data.publicUrl;
  },

  /**
   * Upload a status image
   */
  uploadStatusImage: async (uid: string, fileUri: string, mimeType: string = 'image/jpeg'): Promise<string> => {
    const fileName = `status_${Date.now()}.jpg`;
    const path = `${uid}/${fileName}`;
    await uploadToBucket('status-media', path, fileUri, mimeType);
    const { data } = supabase.storage.from('status-media').getPublicUrl(path);
    return data.publicUrl;
  },

  /**
   * Upload chat media to Supabase storage
   */
  uploadMedia: async (chatId: string, fileUri: string, mimeType: string, fileName: string): Promise<MediaUploadResult> => {
    const path = `${chatId}/${fileName}`;
    await uploadToBucket('chat-media', path, fileUri, mimeType);

    // Get signed URL for private bucket (valid for 1 year)
    const { data, error } = await supabase.storage
      .from('chat-media')
      .createSignedUrl(path, 60 * 60 * 24 * 365);

    if (error || !data) {
      throw error || new Error('Failed to get signed URL');
    }

    // Also cache it locally to save bandwidth, using the folder structured by chatId
    await cacheService.cacheFile(fileUri, chatId, fileName);

    // Read file stats to get file size if possible
    let size = 0;
    try {
      const { localPath, isTemp } = await resolveUriToLocalPath(fileUri, mimeType);
      try {
        const stats = await RNFS.stat(localPath);
        size = stats.size;
      } finally {
        if (isTemp) {
          try {
            await RNFS.unlink(localPath);
          } catch {
            // ignore
          }
        }
      }
    } catch (err) {
      console.warn('Failed to read file size stats:', err);
    }

    return {
      url: data.signedUrl,
      mediaPath: path,
      publicId: path, // alias to avoid TS compile errors in components
      size,
      uploadedAt: Date.now(),
      mode: 'cloud'
    };
  },

  /**
   * Delete media from storage
   */
  deleteMedia: async (mediaPath?: string, bucket: string = 'chat-media'): Promise<void> => {
    if (!mediaPath) return;
    const { error } = await supabase.storage
      .from(bucket)
      .remove([mediaPath]);

    if (error) {
      console.error('Delete media failed:', error);
    }
  },

  /**
   * Delete all media files under a chatId folder in storage
   */
  deleteChatMediaFolder: async (chatId: string, bucket: string = 'chat-media'): Promise<void> => {
    if (!chatId) return;
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(chatId);

      if (error) {
        console.error(`List chat media files failed for chat ${chatId}:`, error);
        return;
      }

      if (data && data.length > 0) {
        const filesToDelete = data.map(file => `${chatId}/${file.name}`);
        const { error: removeError } = await supabase.storage
          .from(bucket)
          .remove(filesToDelete);

        if (removeError) {
          console.error(`Remove chat media files failed for chat ${chatId}:`, removeError);
        } else {
          console.log(`Successfully deleted ${filesToDelete.length} files from ${chatId} folder`);
        }
      }
    } catch (err) {
      console.error(`Error in deleteChatMediaFolder for chat ${chatId}:`, err);
    }
  }
};
