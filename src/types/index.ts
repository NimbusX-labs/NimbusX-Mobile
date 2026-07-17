export type PhoneVisibility = 'everyone' | 'contacts' | 'nobody';
export type ProfileVisibility = 'everyone' | 'contacts' | 'nobody';
export type VerificationType = 'none' | 'phone' | 'official' | 'organization';

export interface User {
  id: string;
  uid: string;
  email: string;
  username?: string;
  shareCode?: string;
  displayName: string;
  avatarUrl?: string;
  status?: string;
  bio?: string;
  phoneE164?: string;
  phoneVerifiedAt?: number;
  lastSeen?: number;
  publicKey?: string;
  discoverableByPhone?: boolean;
  phoneVisibility?: PhoneVisibility;
  usernameChangedAt?: number;
  shareCodeChangedAt?: number;
  verificationType?: VerificationType;
}

export interface UsernameHistoryEntry {
  username: string;
  changedAt: number;
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
  mediaPath?: string;
  mediaSize?: number;
  replyTo?: string;
  isEdited?: boolean;
  isPinned?: boolean;
  mentions?: string[];
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
  expiresAt: number;
  sharedWith: string[];
}

export interface SearchResult {
  uid: string;
  username?: string;
  shareCode?: string;
  displayName: string;
  avatarUrl?: string;
  phoneE164?: string;
  verificationType?: VerificationType;
  isContact: boolean;
}

export interface ContactMatch {
  uid: string;
  username?: string;
  shareCode?: string;
  displayName: string;
  avatarUrl?: string;
  phoneE164?: string;
  verificationType?: VerificationType;
}

export interface ProcessedContact {
  rawName: string;
  e164: string | null;
  hash: string;
}

export interface InvitePayload {
  phoneNumber: string;
  message: string;
}
