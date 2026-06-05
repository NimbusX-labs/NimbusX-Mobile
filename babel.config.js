module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        cwd: 'packagejson',
        root: ['./src'],
        alias: {
          '@assets': './src/assets',
          '@components': './src/components',
          '@data': './src/data',
          '@navigation': './src/navigation',
          '@screens': './src/screens',
          '@services': './src/services',
          '@store': './src/store',
          '@hooks': './src/hooks',
          '@utils': './src/utils',
          '@types': './src/types',
          '@constants': './src/constants',
          '@theme': './src/theme',
        },
      },
    ],
    // react-native-reanimated/plugin removed: Reanimated v4 uses react-native-worklets instead
  ],
};
