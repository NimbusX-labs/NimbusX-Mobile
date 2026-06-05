import { Message } from '@types';
import { StorageMode } from '@store/slices/authSlice';
import { firestoreService } from './supabase/database';
import { storageService } from './supabase/storage';

export interface ChatAttachment {
  uri: string;
  type: 'image' | 'video' | 'audio' | 'file';
  fileName?: string;
  mimeType?: string;
}

const DEFAULT_MIME_TYPE = 'application/octet-stream';

const getAttachmentFileName = (attachment: ChatAttachment) => {
  return attachment.fileName?.trim() || `upload_${Date.now()}.bin`;
};

const getAttachmentMimeType = (attachment: ChatAttachment) => {
  return attachment.mimeType?.trim() || DEFAULT_MIME_TYPE;
};

export const createOptimisticMediaMessage = (
  chatId: string,
  senderId: string,
  messageId: string,
  attachment: ChatAttachment,
): Message => ({
  id: messageId,
  chatId,
  senderId,
  text: '',
  mediaUrl: attachment.uri,
  mediaType: attachment.type,
  createdAt: Date.now(),
  status: 'pending',
});

export const sendMediaMessage = async ({
  chatId,
  senderId,
  messageId,
  attachment,
  storageMode,
}: {
  chatId: string;
  senderId: string;
  messageId: string;
  attachment: ChatAttachment;
  storageMode: StorageMode | null;
}): Promise<Message> => {
  const mimeType = getAttachmentMimeType(attachment);
  const fileName = getAttachmentFileName(attachment);
  const mediaResult = storageMode === 'cloud'
    ? await storageService.uploadMedia(chatId, attachment.uri, mimeType, fileName)
    : await storageService.saveMediaLocally(chatId, attachment.uri, mimeType, fileName);

  const sentMessage: Message = {
    id: messageId,
    chatId,
    senderId,
    text: '',
    mediaUrl: mediaResult.url,
    mediaType: attachment.type,
    mediaPath: mediaResult.mediaPath,
    mediaSize: mediaResult.size,
    createdAt: Date.now(),
    status: 'sent',
  };

  await firestoreService.sendMessage(sentMessage);
  return sentMessage;
};
