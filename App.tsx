import 'react-native-url-polyfill/auto';
import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { LogBox, View, ActivityIndicator, StyleSheet } from 'react-native';
import { store, persistor } from '@store/index';
import AppNavigator from '@navigation/AppNavigator';
import ErrorBoundary from '@components/common/ErrorBoundary';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Silence noisy development-only warnings
LogBox.ignoreLogs([
  'SafeAreaView has been deprecated and will be removed in a future release',
  'InteractionManager has been deprecated and will be removed in a future release',
]);

const LoadingFallback = () => (
  <View style={styles.fallbackContainer}>
    <ActivityIndicator color="#1DA1F2" size="large" />
  </View>
);

// Safety wrapper: if PersistGate hangs for > 3s, skip it and render the app anyway.
// This prevents the black screen caused by AsyncStorage rehydration failures.
const SafePersistGate = ({ children }: { children: React.ReactNode }) => {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <PersistGate persistor={persistor}>
      {(bootstrapped) => {
        if (bootstrapped || timedOut) {
          return children;
        }
        return <LoadingFallback />;
      }}
    </PersistGate>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <SafePersistGate>
        <SafeAreaProvider>
          <ErrorBoundary>
            <AppNavigator />
          </ErrorBoundary>
        </SafeAreaProvider>
      </SafePersistGate>
    </Provider>
  );
};

const styles = StyleSheet.create({
  fallbackContainer: {
    flex: 1,
    backgroundColor: '#15202B',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
