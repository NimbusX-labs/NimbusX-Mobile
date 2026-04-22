import { CLOUDINARY_CONFIG } from '../config/cloudinary';

export interface CloudinaryResult {
  url: string;
  publicId: string;
  resourceType: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  uploadedAt: number;
}

export const cloudinaryService = {
  /**
   * Upload media securely through the backend
   */
  async uploadMedia(uri: string, mimeType: string, folder = 'nimbusx/media'): Promise<CloudinaryResult> {
    try {
      const formData = new FormData();
      
      const fileName = uri.split('/').pop() || 'upload.bin';
      
      formData.append('file', {
        uri,
        type: mimeType || 'application/octet-stream',
        name: fileName,
      } as any);

      formData.append('folder', folder);

      // Abort if backend doesn't respond within 30 seconds
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      let response: Response;
      try {
        response = await fetch(`${CLOUDINARY_CONFIG.BACKEND_URL}/upload`, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            // Note: fetch automatically adds the correct boundary for multipart/form-data
          },
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      return data;
    } catch (error: any) {
      console.error('Cloudinary upload error:', error);
      if (error.name === 'AbortError') {
        throw new Error('Upload timed out. Is the backend server running on port 3001?');
      }
      throw new Error(error.message || 'Storage server unreachable. Check backend connection.');
    }
  },

  /**
   * Delete media asset
   */
  async deleteMedia(publicId: string, resourceType = 'image'): Promise<void> {
    if (!publicId) return;
    
    try {
      const encodedId = encodeURIComponent(publicId);
      const url = `${CLOUDINARY_CONFIG.BACKEND_URL}/media/${encodedId}?resourceType=${resourceType}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Delete failed');
      }
    } catch (error: any) {
      console.error('Cloudinary delete error:', error);
      throw new Error(error.message || 'Storage server unreachable. Check backend connection.');
    }
  }
};
