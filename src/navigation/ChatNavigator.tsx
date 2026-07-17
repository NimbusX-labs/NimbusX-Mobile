import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ChatStackParamList } from './types';
import { useThemeColors } from '@theme/colors';

// Navigators
import MainNavigator from './MainNavigator';

// Screens
import ChatScreen from '@screens/chats/ChatScreen';
import NewChatScreen from '@screens/chats/NewChatScreen';
import CreateGroupScreen from '@screens/groups/CreateGroupScreen';
import GroupChatScreen from '@screens/groups/GroupChatScreen';
import GroupInfoScreen from '@screens/groups/GroupInfoScreen';
import ContactInfoScreen from '@screens/chats/ContactInfoScreen';
import ContactSyncScreen from '@screens/chats/ContactSyncScreen';
import ProfileScreen from '@screens/settings/ProfileScreen';
import StorageSetupScreen from '@screens/settings/StorageSetupScreen';
import AccountSettingsScreen from '@screens/settings/AccountSettingsScreen';
import ChatsSettingsScreen from '@screens/settings/ChatsSettingsScreen';
import NotificationsSettingsScreen from '@screens/settings/NotificationsSettingsScreen';
import HelpSettingsScreen from '@screens/settings/HelpSettingsScreen';
import TermsPrivacyScreen from '@screens/settings/TermsPrivacyScreen';
import HelpCenterScreen from '@screens/settings/HelpCenterScreen';
import ContactUsScreen from '@screens/settings/ContactUsScreen';
import AppInfoScreen from '@screens/settings/AppInfoScreen';
import PrivacySettingsScreen from '@screens/settings/PrivacySettingsScreen';
import SecuritySettingsScreen from '@screens/settings/SecuritySettingsScreen';
import ChangeNumberScreen from '@screens/settings/ChangeNumberScreen';
import DevicesScreen from '@screens/settings/DevicesScreen';
import RequestInfoScreen from '@screens/settings/RequestInfoScreen';
import QRCodeScreen from '@screens/settings/QRCodeScreen';
import UsernameSetupScreen from '@screens/auth/UsernameSetupScreen';

const Stack = createStackNavigator<ChatStackParamList>();

const ChatNavigator = () => {
  const colors = useThemeColors();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primaryBackground,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.divider,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 17,
        },
        cardStyle: { backgroundColor: colors.primaryBackground },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="GroupChat" component={GroupChatScreen} />
      <Stack.Screen name="NewChat" component={NewChatScreen} />
      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
      <Stack.Screen name="GroupInfo" component={GroupInfoScreen} />
      <Stack.Screen name="ContactInfo" component={ContactInfoScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="StorageSettings" component={StorageSetupScreen} options={{ title: 'Storage' }} />
      <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} options={{ title: 'Account' }} />
      <Stack.Screen name="ChatsSettings" component={ChatsSettingsScreen} options={{ title: 'Chats' }} />
      <Stack.Screen name="NotificationsSettings" component={NotificationsSettingsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="HelpSettings" component={HelpSettingsScreen} options={{ title: 'Help' }} />
      <Stack.Screen name="TermsPrivacy" component={TermsPrivacyScreen} options={{ title: 'Terms & Privacy' }} />
      <Stack.Screen name="HelpCenter" component={HelpCenterScreen} options={{ title: 'Help Center' }} />
      <Stack.Screen name="ContactUs" component={ContactUsScreen} options={{ title: 'Contact Us' }} />
      <Stack.Screen name="AppInfo" component={AppInfoScreen} options={{ title: 'App Info' }} />
      <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} options={{ title: 'Privacy' }} />
      <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} options={{ title: 'Security' }} />
      <Stack.Screen name="ChangeNumber" component={ChangeNumberScreen} options={{ title: 'Change Number' }} />
      <Stack.Screen name="Devices" component={DevicesScreen} options={{ title: 'Linked Devices' }} />
      <Stack.Screen name="RequestInfo" component={RequestInfoScreen} options={{ title: 'Request Account Info' }} />
      <Stack.Screen name="QRCode" component={QRCodeScreen} options={{ title: 'My QR Code' }} />
      <Stack.Screen name="ContactSync" component={ContactSyncScreen} options={{ title: 'Find Contacts' }} />
      <Stack.Screen name="UsernameSetup" component={UsernameSetupScreen} options={{ title: 'Nimbus ID' }} />
    </Stack.Navigator>
  );
};

export default ChatNavigator;
