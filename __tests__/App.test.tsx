/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('redux-persist', () => ({
  FLUSH: 'persist/FLUSH',
  PAUSE: 'persist/PAUSE',
  PERSIST: 'persist/PERSIST',
  PURGE: 'persist/PURGE',
  REGISTER: 'persist/REGISTER',
  REHYDRATE: 'persist/REHYDRATE',
  persistReducer: (_config: unknown, reducer: unknown) => reducer,
  persistStore: jest.fn(() => ({
    flush: jest.fn(() => Promise.resolve()),
    pause: jest.fn(),
    persist: jest.fn(),
    purge: jest.fn(() => Promise.resolve()),
  })),
}));

jest.mock('redux-persist/integration/react', () => ({
  PersistGate: ({ children }: { children: React.ReactNode | ((bootstrapped: boolean) => React.ReactNode) }) =>
    typeof children === 'function' ? children(true) : children,
}));

jest.mock('@navigation/AppNavigator', () => {
  const React = require('react');
  const { View } = require('react-native');

  return function MockAppNavigator() {
    return React.createElement(View);
  };
});

test('renders correctly', () => {
  jest.useFakeTimers();
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  try {
    const App = require('../App').default;

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<App />);
    });

    ReactTestRenderer.act(() => {
      jest.runOnlyPendingTimers();
    });

    ReactTestRenderer.act(() => {
      renderer?.unmount();
    });
  } finally {
    jest.useRealTimers();
  }
});
