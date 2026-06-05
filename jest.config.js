module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-url-polyfill|react-redux|@reduxjs/toolkit|redux-persist|@supabase|immer|redux|reselect|redux-thunk)/)',
  ],
};
