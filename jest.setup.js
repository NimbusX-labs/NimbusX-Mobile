/* global jest */

require('react-native-gesture-handler/jestSetup');

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
  },
}));

jest.mock('./src/services/supabase/auth', () => ({
  authService: {
    getCurrentUser: jest.fn(() => Promise.resolve(null)),
    onAuthStateChanged: jest.fn((callback) => {
      callback(null);
      return jest.fn();
    }),
    signOut: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('./src/services/supabase/database', () => ({
  firestoreService: {
    getUser: jest.fn(() => Promise.resolve(null)),
    saveUser: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('@react-navigation/native', () => {
  const React = require('react');

  return {
    DarkTheme: {
      dark: true,
      colors: {},
    },
    NavigationContainer: ({ children }) => React.createElement(React.Fragment, null, children),
    useNavigation: () => ({
      goBack: jest.fn(),
      navigate: jest.fn(),
      replace: jest.fn(),
      setOptions: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
  };
});

const createMockNavigator = () => ({
  Navigator: ({ children }) => {
    const React = require('react');

    return React.createElement(React.Fragment, null, children);
  },
  Screen: () => null,
});

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => createMockNavigator(),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => createMockNavigator(),
}));

jest.mock('react-native-vector-icons/Ionicons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return function MockIcon(props) {
    return React.createElement(Text, props);
  };
});

jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(),
  launchImageLibrary: jest.fn(),
}));

jest.mock('react-native-document-picker', () => ({
  pick: jest.fn(),
  isCancel: jest.fn(),
  types: {
    allFiles: '*/*',
  },
}));

jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/tmp',
  copyFile: jest.fn(),
  exists: jest.fn(),
  mkdir: jest.fn(),
  readFile: jest.fn(),
  unlink: jest.fn(),
}));
