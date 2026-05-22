import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ChatStackParamList } from './types';
import { colors } from '@theme/colors';

// Navigators
import MainNavigator from './MainNavigator';

// Screens
import ChatScreen from '@screens/chats/ChatScreen';
import NewChatScreen from '@screens/chats/NewChatScreen';
import CreateGroupScreen from '@screens/groups/CreateGroupScreen';
import GroupChatScreen from '@screens/groups/GroupChatScreen';
import GroupInfoScreen from '@screens/groups/GroupInfoScreen';
import ProfileScreen from '@screens/settings/ProfileScreen';

import AccountSettingsScreen from '@screens/settings/AccountSettingsScreen';
import ChatsSettingsScreen from '@screens/settings/ChatsSettingsScreen';
import NotificationsSettingsScreen from '@screens/settings/NotificationsSettingsScreen';
import HelpSettingsScreen from '@screens/settings/HelpSettingsScreen';

const Stack = createStackNavigator<ChatStackParamList>();

const ChatNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primaryBackground,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.divider,
        },
        headerTintColor: colors.textPrimary,
        cardStyle: { backgroundColor: colors.primaryBackground },
      }}
    >
      <Stack.Screen 
        name="MainTabs" 
        component={MainNavigator} 
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="GroupChat" component={GroupChatScreen} />
      <Stack.Screen name="NewChat" component={NewChatScreen} />
      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
      <Stack.Screen name="GroupInfo" component={GroupInfoScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} options={{ title: 'Account' }} />
      <Stack.Screen name="ChatsSettings" component={ChatsSettingsScreen} options={{ title: 'Chats' }} />
      <Stack.Screen name="NotificationsSettings" component={NotificationsSettingsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="HelpSettings" component={HelpSettingsScreen} options={{ title: 'Help' }} />
    </Stack.Navigator>
  );
};

export default ChatNavigator;
