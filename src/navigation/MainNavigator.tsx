import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import { useThemeColors } from '@theme/colors';
import { MainTabParamList } from './types';

// Screens
import ChatListScreen from '@screens/chats/ChatListScreen';
import StatusScreen from '@screens/status/StatusScreen';
import GroupsScreen from '@screens/groups/GroupsScreen';
import FilesScreen from '@screens/chats/FilesScreen';
import SettingsScreen from '@screens/settings/SettingsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const getTabBarIcon = (routeName: string, focused: boolean, color: string, size: number) => {
  let iconName = '';
  if (routeName === 'Chats') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
  else if (routeName === 'Status') iconName = focused ? 'pulse' : 'pulse-outline';
  else if (routeName === 'Groups') iconName = focused ? 'people' : 'people-outline';
  else if (routeName === 'Files') iconName = focused ? 'folder' : 'folder-outline';
  else if (routeName === 'Settings') iconName = focused ? 'settings' : 'settings-outline';
  return <Icon name={iconName} size={size - 2} color={color} />;
};

const MainNavigator = () => {
  const colors = useThemeColors();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => getTabBarIcon(route.name, focused, color, size),
        tabBarActiveTintColor: colors.primaryAccent,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.primaryBackground,
          borderTopColor: colors.divider,
          borderTopWidth: 0.5,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: colors.primaryBackground,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.divider,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 20,
        },
      })}
    >
      <Tab.Screen name="Chats" component={ChatListScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Status" component={StatusScreen} options={{ tabBarLabel: 'Pulse' }} />
      <Tab.Screen name="Groups" component={GroupsScreen} />
      <Tab.Screen name="Files" component={FilesScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
};

export default MainNavigator;
