import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Visibility = 'Everyone' | 'Contacts' | 'Nobody';
export type PhoneVisibility = 'everyone' | 'contacts' | 'nobody';
export type ThemeMode = 'system' | 'dark' | 'light' | 'slate' | 'teal' | 'emerald';

export interface DeviceSession {
  id: string;
  device: string;
  deviceIcon: string;
  location: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface SupportTicket {
  id: string;
  category: string;
  message: string;
  timestamp: number;
}

interface BlockedUser {
  uid: string;
  displayName: string;
  email: string;
  avatarUrl: string;
}

interface SettingsState {
  // Privacy
  discoverableByPhone: boolean;
  readReceipts: boolean;
  lastSeen: boolean;
  onlineStatus: boolean;
  profilePhotoVisibility: Visibility;
  lastSeenVisibility: Visibility;
  phoneVisibility: PhoneVisibility;
  statusVisibility: Visibility;
  typingIndicator: boolean;
  blockedUsers: BlockedUser[];

  // Security
  appLockEnabled: boolean;
  appLockPin: string | null;
  securityNotifications: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret: string | null;

  // Chats
  theme: ThemeMode;
  wallpaper: string | null;
  enterIsSend: boolean;
  mediaVisibility: boolean;
  lastBackupTime: number | null;
  isBackingUp: boolean;

  // Notifications
  conversationTones: boolean;
  messageTone: string;
  messageVibrate: string;
  messageLight: string;
  messageHighPriority: boolean;
  groupTone: string;
  groupVibrate: string;
  groupLight: string;
  groupHighPriority: boolean;
  callRingtone: string;
  callVibrate: string;

  // Devices
  sessions: DeviceSession[];

  // Request Info
  reportStatus: 'idle' | 'pending' | 'ready';
  requestDate: string | null;
  expiryDate: string | null;

  // Contact Us Tickets
  tickets: SupportTicket[];
}

const initialState: SettingsState = {
  discoverableByPhone: true,
  readReceipts: true,
  lastSeen: true,
  onlineStatus: true,
  profilePhotoVisibility: 'Everyone',
  lastSeenVisibility: 'Contacts',
  phoneVisibility: 'everyone',
  statusVisibility: 'Everyone',
  typingIndicator: true,
  blockedUsers: [],

  appLockEnabled: false,
  appLockPin: null,
  securityNotifications: true,
  twoFactorEnabled: false,
  twoFactorSecret: null,

  theme: 'dark',
  wallpaper: null,
  enterIsSend: false,
  mediaVisibility: true,
  lastBackupTime: null,
  isBackingUp: false,

  conversationTones: true,
  messageTone: 'Default',
  messageVibrate: 'Default',
  messageLight: 'White',
  messageHighPriority: true,
  groupTone: 'Default',
  groupVibrate: 'Default',
  groupLight: 'White',
  groupHighPriority: true,
  callRingtone: 'Default',
  callVibrate: 'Default',

  sessions: [],

  reportStatus: 'idle',
  requestDate: null,
  expiryDate: null,

  tickets: [],
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    toggleReadReceipts: (state) => {
      state.readReceipts = !state.readReceipts;
    },
    toggleDiscoverableByPhone: (state) => {
      state.discoverableByPhone = !state.discoverableByPhone;
    },
    toggleLastSeen: (state) => {
      state.lastSeen = !state.lastSeen;
    },
    toggleOnlineStatus: (state) => {
      state.onlineStatus = !state.onlineStatus;
    },
    setProfilePhotoVisibility: (state, action: PayloadAction<Visibility>) => {
      state.profilePhotoVisibility = action.payload;
    },
    setLastSeenVisibility: (state, action: PayloadAction<Visibility>) => {
      state.lastSeenVisibility = action.payload;
    },
    setPhoneVisibility: (state, action: PayloadAction<PhoneVisibility>) => {
      state.phoneVisibility = action.payload;
    },
    setStatusVisibility: (state, action: PayloadAction<Visibility>) => {
      state.statusVisibility = action.payload;
    },
    setTypingIndicator: (state, action: PayloadAction<boolean>) => {
      state.typingIndicator = action.payload;
    },
    blockUser: (state, action: PayloadAction<BlockedUser>) => {
      if (!state.blockedUsers.some((u) => u.uid === action.payload.uid)) {
        state.blockedUsers.push(action.payload);
      }
    },
    unblockUser: (state, action: PayloadAction<string>) => {
      state.blockedUsers = state.blockedUsers.filter((u) => u.uid !== action.payload);
    },
    setAppLock: (state, action: PayloadAction<{ enabled: boolean; pin: string | null }>) => {
      state.appLockEnabled = action.payload.enabled;
      state.appLockPin = action.payload.pin;
    },
    toggleSecurityNotifications: (state) => {
      state.securityNotifications = !state.securityNotifications;
    },
    setTwoFactor: (state, action: PayloadAction<{ enabled: boolean; secret: string | null }>) => {
      state.twoFactorEnabled = action.payload.enabled;
      state.twoFactorSecret = action.payload.secret;
    },
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.theme = action.payload;
    },
    setWallpaper: (state, action: PayloadAction<string | null>) => {
      state.wallpaper = action.payload;
    },
    toggleEnterIsSend: (state) => {
      state.enterIsSend = !state.enterIsSend;
    },
    toggleMediaVisibility: (state) => {
      state.mediaVisibility = !state.mediaVisibility;
    },
    setBackupState: (state, action: PayloadAction<{ backingUp: boolean; lastBackupTime: number | null }>) => {
      state.isBackingUp = action.payload.backingUp;
      if (action.payload.lastBackupTime !== undefined) {
        state.lastBackupTime = action.payload.lastBackupTime;
      }
    },
    toggleConversationTones: (state) => {
      state.conversationTones = !state.conversationTones;
    },
    setMessageTone: (state, action: PayloadAction<string>) => {
      state.messageTone = action.payload;
    },
    setMessageVibrate: (state, action: PayloadAction<string>) => {
      state.messageVibrate = action.payload;
    },
    setMessageLight: (state, action: PayloadAction<string>) => {
      state.messageLight = action.payload;
    },
    toggleMessageHighPriority: (state) => {
      state.messageHighPriority = !state.messageHighPriority;
    },
    setGroupTone: (state, action: PayloadAction<string>) => {
      state.groupTone = action.payload;
    },
    setGroupVibrate: (state, action: PayloadAction<string>) => {
      state.groupVibrate = action.payload;
    },
    setGroupLight: (state, action: PayloadAction<string>) => {
      state.groupLight = action.payload;
    },
    toggleGroupHighPriority: (state) => {
      state.groupHighPriority = !state.groupHighPriority;
    },
    setCallRingtone: (state, action: PayloadAction<string>) => {
      state.callRingtone = action.payload;
    },
    setCallVibrate: (state, action: PayloadAction<string>) => {
      state.callVibrate = action.payload;
    },
    terminateSession: (state, action: PayloadAction<string>) => {
      state.sessions = state.sessions.filter((s) => s.id !== action.payload);
    },
    terminateAllOtherSessions: (state) => {
      state.sessions = state.sessions.filter((s) => s.isCurrent);
    },
    linkDevice: (state, action: PayloadAction<DeviceSession>) => {
      if (!state.sessions.some((s) => s.id === action.payload.id)) {
        state.sessions.push(action.payload);
      }
    },
    setRequestStatus: (state, action: PayloadAction<{ status: 'idle' | 'pending' | 'ready'; requestDate: string | null; expiryDate: string | null }>) => {
      state.reportStatus = action.payload.status;
      state.requestDate = action.payload.requestDate;
      state.expiryDate = action.payload.expiryDate;
    },
    addTicket: (state, action: PayloadAction<SupportTicket>) => {
      state.tickets.push(action.payload);
    },
  },
});

export const {
  toggleReadReceipts,
  toggleDiscoverableByPhone,
  toggleLastSeen,
  toggleOnlineStatus,
  setProfilePhotoVisibility,
  setLastSeenVisibility,
  setPhoneVisibility,
  setStatusVisibility,
  setTypingIndicator,
  blockUser,
  unblockUser,
  setAppLock,
  toggleSecurityNotifications,
  setTwoFactor,
  setTheme,
  setWallpaper,
  toggleEnterIsSend,
  toggleMediaVisibility,
  setBackupState,
  toggleConversationTones,
  setMessageTone,
  setMessageVibrate,
  setMessageLight,
  toggleMessageHighPriority,
  setGroupTone,
  setGroupVibrate,
  setGroupLight,
  toggleGroupHighPriority,
  setCallRingtone,
  setCallVibrate,
  terminateSession,
  terminateAllOtherSessions,
  linkDevice,
  setRequestStatus,
  addTicket,
} = settingsSlice.actions;

export default settingsSlice.reducer;
