import React, { useEffect, useState } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import { authService } from '@services/supabase/auth';
import { firestoreService } from '@services/supabase/database';
import { setUser } from '@store/slices/authSlice';

// Navigators
import AuthNavigator from './AuthNavigator';
import ChatNavigator from './ChatNavigator';

// Components
import { View, StyleSheet, ActivityIndicator } from 'react-native';

/** Resolves/rejects after `ms` milliseconds — used to race against slow Firestore fetches */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms),
    ),
  ]);
}

// Custom dark theme to prevent black/white flash during hydration or navigation transitions
const AppTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#15202B',
    card: '#15202B',
    text: '#E7E9EA',
    border: '#38444D',
    primary: '#1DA1F2',
    notification: '#1DA1F2',
  },
};

const AppNavigator = () => {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  // Local state only — never touches redux-persist
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      // try-finally guarantees setInitialized(true) is called even if Firestore hangs
      try {
        if (firebaseUser) {
          let displayName = firebaseUser.displayName || '';
          let avatarUrl = firebaseUser.avatarUrl || '';

          try {
            // Timeout the Firestore fetch at 5 seconds so we never hang here
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

          const mergedUser = {
            uid: firebaseUser.uid,
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName,
            avatarUrl,
          };

          // Best-effort Firestore save — don't await, don't block loading
          firestoreService.saveUser({
            uid: mergedUser.uid,
            email: mergedUser.email,
            displayName: mergedUser.displayName,
            avatarUrl: mergedUser.avatarUrl,
          }).catch((e) => console.warn('AppNavigator: background save failed:', e));

          dispatch(setUser(mergedUser));
        } else {
          dispatch(setUser(null));
        }
      } catch (err) {
        console.error('AppNavigator: onAuthStateChanged handler crashed:', err);
        dispatch(setUser(null));
      } finally {
        // ALWAYS run — even if every await above threw or timed out
        setInitialized(true);
      }
    });

    return unsubscribe;
  }, [dispatch]);

  if (!initialized) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={AppTheme}>
      {user ? <ChatNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#15202B',
  },
});

export default AppNavigator;
