import 'react-native-url-polyfill/auto';
import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { StatusBar, LogBox, View, ActivityIndicator } from 'react-native';
import { store, persistor } from '@store/index';
import AppNavigator from '@navigation/AppNavigator';
import ErrorBoundary from '@components/common/ErrorBoundary';

// Silence noisy development-only warnings
LogBox.ignoreLogs([
  'SafeAreaView has been deprecated and will be removed in a future release',
  'InteractionManager has been deprecated and will be removed in a future release',
]);

const LoadingFallback = () => (
  <View style={{ flex: 1, backgroundColor: '#15202B', justifyContent: 'center', alignItems: 'center' }}>
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
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (timedOut) {
    return <>{children}</>;
  }

  return (
    <PersistGate loading={<LoadingFallback />} persistor={persistor}>
      {children}
    </PersistGate>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <SafePersistGate>
        <ErrorBoundary>
          <StatusBar barStyle="light-content" backgroundColor="#15202B" />
          <AppNavigator />
        </ErrorBoundary>
      </SafePersistGate>
    </Provider>
  );
};

export default App;
