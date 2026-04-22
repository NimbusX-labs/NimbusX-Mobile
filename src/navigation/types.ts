export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Chats: undefined;
  Groups: undefined;
  Status: undefined;
  Settings: undefined;
};

export type ChatStackParamList = {
  MainTabs: undefined;
  Chat: { chatId: string; otherUserName?: string; otherUserAvatar?: string };
  GroupChat: { chatId: string; groupName: string; groupAvatar?: string };
  NewChat: undefined;
  CreateGroup: undefined;
  GroupInfo: { chatId: string };
  Profile: undefined;
};

export type RootStackParamList = {
  AuthStack: undefined;
  ChatStack: undefined;
};
