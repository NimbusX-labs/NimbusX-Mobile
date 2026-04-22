import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '@theme/colors';
import { MainTabParamList } from './types';

// Screens
import ChatListScreen from '@screens/chats/ChatListScreen';
import GroupsScreen from '@screens/groups/GroupsScreen';
import StatusScreen from '@screens/status/StatusScreen';
import SettingsScreen from '@screens/settings/SettingsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const getTabBarIcon = (routeName: string, focused: boolean, color: string, size: number) => {
  let iconName = '';
  if (routeName === 'Chats') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
  else if (routeName === 'Groups') iconName = focused ? 'people' : 'people-outline';
  else if (routeName === 'Status') iconName = focused ? 'ellipse' : 'ellipse-outline';
  else if (routeName === 'Settings') iconName = focused ? 'settings' : 'settings-outline';
  return <Icon name={iconName} size={size} color={color} />;
};

const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => getTabBarIcon(route.name, focused, color, size),
        tabBarActiveTintColor: colors.primaryAccent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.primaryBackground,
          borderTopColor: colors.divider,
        },
        headerStyle: {
          backgroundColor: colors.primaryBackground,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.divider,
        },
        headerTintColor: colors.textPrimary,
      })}
    >
      <Tab.Screen name="Chats" component={ChatListScreen} />
      <Tab.Screen name="Groups" component={GroupsScreen} />
      <Tab.Screen name="Status" component={StatusScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export default MainNavigator;
