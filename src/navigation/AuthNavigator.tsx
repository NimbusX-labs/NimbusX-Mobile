import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthStackParamList } from './types';
import { useThemeColors } from '@theme/colors';

// Screens
import LoginScreen from '@screens/auth/LoginScreen';
import RegisterScreen from '@screens/auth/RegisterScreen';
import ForgotPasswordScreen from '@screens/auth/ForgotPasswordScreen';
import UsernameSetupScreen from '@screens/auth/UsernameSetupScreen';
import PhoneRegisterScreen from '@screens/auth/PhoneRegisterScreen';

const Stack = createStackNavigator<AuthStackParamList>();

const AuthNavigator = () => {
  const colors = useThemeColors();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.primaryBackground },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="UsernameSetup" component={UsernameSetupScreen} />
      <Stack.Screen name="PhoneRegister" component={PhoneRegisterScreen} />
    </Stack.Navigator>
  );
};


export default AuthNavigator;
