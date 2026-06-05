export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Chats: undefined;
  Status: undefined;
  Groups: undefined;
  Files: undefined;
  Settings: undefined;
};

export type ChatStackParamList = {
  MainTabs: undefined;
  Chat: { chatId: string; otherUserName?: string; otherUserAvatar?: string };
  GroupChat: { chatId: string; groupName: string; groupAvatar?: string };
  NewChat: undefined;
  CreateGroup: undefined;
  GroupInfo: { chatId: string };
  ContactInfo: { chatId: string; otherUserName?: string; otherUserAvatar?: string };
  Profile: undefined;
  StorageSettings: undefined;
  AccountSettings: undefined;
  ChatsSettings: undefined;
  NotificationsSettings: undefined;
  HelpSettings: undefined;
  TermsPrivacy: undefined;
  HelpCenter: undefined;
  ContactUs: undefined;
  AppInfo: undefined;
  PrivacySettings: undefined;
  SecuritySettings: undefined;
  ChangeNumber: undefined;
  Devices: undefined;
  RequestInfo: undefined;
};

export type RootStackParamList = {
  AuthStack: undefined;
  ChatStack: undefined;
};
