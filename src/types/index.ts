export interface User {
  id: string; // Required for entity adapter
  uid: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  status?: string;
  lastSeen?: number;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: number;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'file' | 'gif' | 'sticker';
  mediaPublicId?: string; // Cloudinary public_id
  mediaSize?: number;     // File size in bytes
  mediaUploadedAt?: number;
  storageMode?: 'local' | 'cloud';
  replyTo?: string;
}

export interface Chat {
  id: string;
  type: 'one-to-one' | 'group';
  members: string[];
  name?: string;
  description?: string;
  avatarUrl?: string;
  lastMessage?: string;
  lastMessageAt?: number;
  lastMessageSenderId?: string;
  unreadCount?: { [uid: string]: number };
  typing?: { [uid: string]: boolean };
  admins?: { [uid: string]: boolean };
  createdBy?: string;
  createdAt?: number;
}

export interface Group extends Chat {
  type: 'group';
  description?: string;
  createdBy: string;
}

export interface Status {
  id: string;
  uid: string;
  displayName: string;
  avatarUrl?: string;
  text?: string;
  imageUrl?: string;
  createdAt: number;
  expiresAt: number; // 24 hours after creation
}
