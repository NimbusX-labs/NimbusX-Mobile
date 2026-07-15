import React, { useEffect, useState } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import { authService } from '@services/supabase/auth';
import { firestoreService } from '@services/supabase/database';
import { setUser, logout } from '@store/slices/authSlice';
import { persistor } from '../store';
import { useThemeColors, updateThemeStyles } from '@theme/colors';
import { useColorScheme } from 'react-native';
import { spacing } from '@theme/spacing';
import { cryptoService } from '@utils/crypto';

// Navigators
import AuthNavigator from './AuthNavigator';
import ChatNavigator from './ChatNavigator';
import StorageSetupScreen from '@screens/settings/StorageSetupScreen';
import { createStackNavigator } from '@react-navigation/stack';

const SetupStack = createStackNavigator();
const SetupNavigator = () => (
  <SetupStack.Navigator screenOptions={{ headerShown: false }}>
    <SetupStack.Screen name="StorageSetup" component={StorageSetupScreen} />
  </SetupStack.Navigator>
);
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Alert, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

// ── App Lock PIN Overlay Screen ──────────────────────────────────────────────
interface PinLockScreenProps {
  pin: string;
  onUnlock: () => void;
  onLogout: () => void;
}

const createLockStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBackground,
    justifyContent: 'space-between',
    paddingVertical: spacing.xl * 2,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: colors.primaryAccent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.l,
    marginVertical: spacing.xl,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.divider,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: colors.primaryAccent,
    borderColor: colors.primaryAccent,
  },
  keypad: {
    paddingHorizontal: spacing.xl * 1.5,
    marginBottom: spacing.l,
    gap: spacing.m,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.l,
  },
  keyButton: {
    flex: 1,
    aspectRatio: 1.5,
    borderRadius: 12,
    backgroundColor: colors.secondaryBackground,
    borderWidth: 0.5,
    borderColor: colors.divider,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyText: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  actionButton: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});

const PinLockScreen = ({ pin, onUnlock, onLogout }: PinLockScreenProps) => {
  const [enteredPin, setEnteredPin] = useState('');
  const colors = useThemeColors();
  const lockStyles = createLockStyles(colors);

  const themeMode = useAppSelector((state) => state.settings.theme);
  const systemScheme = useColorScheme() || 'dark';
  const isLightTheme = themeMode === 'light' || (themeMode === 'system' && systemScheme === 'light');

  const handleKeyPress = (num: string) => {
    if (enteredPin.length >= 4) return;
    const newPin = enteredPin + num;
    setEnteredPin(newPin);

    if (newPin.length === 4) {
      if (newPin === pin) {
        onUnlock();
      } else {
        setTimeout(() => {
          Alert.alert('Incorrect PIN', 'The PIN code you entered is invalid. Please try again.');
          setEnteredPin('');
        }, 150);
      }
    }
  };

  const handleBackspace = () => {
    setEnteredPin(prev => prev.slice(0, -1));
  };

  const handleForgotPin = () => {
    Alert.alert(
      'Forgot PIN?',
      'If you forgot your PIN, you will need to log out and sign back in. This will also clear all offline cache database records.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: onLogout },
      ]
    );
  };

  const dots = [0, 1, 2, 3];

  return (
    <SafeAreaView style={lockStyles.container}>
      <StatusBar barStyle={isLightTheme ? "dark-content" : "light-content"} backgroundColor={colors.primaryBackground} />
      
      <View style={lockStyles.header}>
        <View style={lockStyles.iconCircle}>
          <Icon name="lock-closed" size={32} color={colors.primaryAccent} />
        </View>
        <Text style={lockStyles.title}>NimbusX Locked</Text>
        <Text style={lockStyles.subtitle}>Enter your 4-digit security PIN</Text>
      </View>

      {/* Dots display */}
      <View style={lockStyles.dotsRow}>
        {dots.map((index) => (
          <View
            key={index}
            style={[
              lockStyles.dot,
              enteredPin.length > index && lockStyles.dotFilled
            ]}
          />
        ))}
      </View>

      {/* Keypad */}
      <View style={lockStyles.keypad}>
        {/* Rows */}
        <View style={lockStyles.keypadRow}>
          {['1', '2', '3'].map(num => (
            <TouchableOpacity key={num} style={lockStyles.keyButton} onPress={() => handleKeyPress(num)}>
              <Text style={lockStyles.keyText}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={lockStyles.keypadRow}>
          {['4', '5', '6'].map(num => (
            <TouchableOpacity key={num} style={lockStyles.keyButton} onPress={() => handleKeyPress(num)}>
              <Text style={lockStyles.keyText}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={lockStyles.keypadRow}>
          {['7', '8', '9'].map(num => (
            <TouchableOpacity key={num} style={lockStyles.keyButton} onPress={() => handleKeyPress(num)}>
              <Text style={lockStyles.keyText}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={lockStyles.keypadRow}>
          <TouchableOpacity style={[lockStyles.keyButton, lockStyles.actionButton]} onPress={handleForgotPin}>
            <Text style={lockStyles.actionText}>Forgot?</Text>
          </TouchableOpacity>
          <TouchableOpacity style={lockStyles.keyButton} onPress={() => handleKeyPress('0')}>
            <Text style={lockStyles.keyText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[lockStyles.keyButton, lockStyles.actionButton]} onPress={handleBackspace}>
            <Icon name="backspace-outline" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

// ── SafeAreaView placeholder for screen locks ─────────────────────────────────
import { SafeAreaView } from 'react-native-safe-area-context';

/** Resolves/rejects after `ms` milliseconds — used to race against slow Firestore fetches */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms),
    ),
  ]);
}


const AppNavigator = () => {
  const { user, storageMode } = useAppSelector((state) => state.auth);
  const { appLockEnabled, appLockPin } = useAppSelector((state) => state.settings);
  const dispatch = useAppDispatch();
  const [initialized, setInitialized] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (appLockEnabled && appLockPin) {
      setIsLocked(true);
    } else {
      setIsLocked(false);
    }
  }, [appLockEnabled, appLockPin]);

  const handleLogout = async () => {
    try {
      await authService.signOut();
      dispatch(logout());
      await persistor.purge();
    } catch (error) {
      console.error('Failed to log out from lock screen:', error);
    }
  };

  useEffect(() => {
    let active = true;
    const timeoutId = setTimeout(() => {
      if (active) {
        console.warn('AppNavigator: Auth initialization timed out, forcing initialized = true');
        setInitialized(true);
      }
    }, 2000);

    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      if (!active) return;
      try {
        if (firebaseUser) {
          let displayName = firebaseUser.displayName || '';
          let avatarUrl = firebaseUser.avatarUrl || '';

          try {
            const firestoreUser = await withTimeout(
              firestoreService.getUser(firebaseUser.uid),
              5000,
            );
            if (firestoreUser) {
              displayName = firestoreUser.displayName || displayName;
              avatarUrl = firestoreUser.avatarUrl || avatarUrl;
            }
          } catch (fetchErr) {
            console.warn('AppNavigator: Firestore fetch timed out or failed, using Auth data:', fetchErr);
          }

          let publicKey = '';
          try {
            publicKey = await cryptoService.getOrCreateKeyPair(firebaseUser.uid);
          } catch (keyErr) {
            console.error('AppNavigator: key pair generation failed:', keyErr);
          }

          const mergedUser = {
            uid: firebaseUser.uid,
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName,
            avatarUrl,
            publicKey,
          };

          try {
            await firestoreService.saveUser({
              uid: mergedUser.uid,
              email: mergedUser.email,
              displayName: mergedUser.displayName,
              avatarUrl: mergedUser.avatarUrl,
              publicKey: mergedUser.publicKey,
            });
          } catch (e) {
            console.warn('AppNavigator: profile save failed:', e);
          }

          dispatch(setUser(mergedUser));
        } else {
          dispatch(setUser(null));
        }
      } catch (err) {
        console.error('AppNavigator: onAuthStateChanged handler crashed:', err);
        dispatch(setUser(null));
      } finally {
        if (active) {
          clearTimeout(timeoutId);
          setInitialized(true);
        }
      }
    });

    return () => {
      active = false;
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [dispatch]);

  const colors = useThemeColors();
  const themeMode = useAppSelector((state) => state.settings.theme);
  const systemScheme = useColorScheme() || 'dark';
  const isLightTheme = themeMode === 'light' || (themeMode === 'system' && systemScheme === 'light');

  useEffect(() => {
    updateThemeStyles(colors);
  }, [colors]);

  const AppTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: colors.primaryBackground,
      card: colors.primaryBackground,
      text: colors.textPrimary,
      border: colors.divider,
      primary: colors.primaryAccent,
      notification: colors.primaryAccent,
    },
  };

  if (!initialized) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.primaryBackground }]}>
        <ActivityIndicator size="large" color={colors.primaryAccent} />
      </View>
    );
  }

  // Navigation tree:
  // 1. Not logged in → AuthNavigator
  // 2. PIN lock enabled & active → PinLockScreen
  // 3. Logged in but no storage mode chosen → StorageSetupScreen
  // 4. Logged in with storage mode → ChatNavigator (main app)
  const renderContent = () => {
    if (!user) return <AuthNavigator />;
    if (appLockEnabled && appLockPin && isLocked) {
      return (
        <PinLockScreen
          pin={appLockPin}
          onUnlock={() => setIsLocked(false)}
          onLogout={handleLogout}
        />
      );
    }
    if (!storageMode) return <SetupNavigator />;
    return <ChatNavigator />;
  };

  return (
    <NavigationContainer theme={AppTheme}>
      <StatusBar
        barStyle={isLightTheme ? 'dark-content' : 'light-content'}
        backgroundColor={colors.primaryBackground}
      />
      {renderContent()}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppNavigator;
