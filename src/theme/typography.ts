import { Platform } from 'react-native';

export const typography = {
  fontFamily: {
    regular: Platform.OS === 'ios' ? 'System' : 'Roboto',
    medium: Platform.OS === 'ios' ? 'System' : 'Roboto-Medium',
    bold: Platform.OS === 'ios' ? 'System' : 'Roboto-Bold',
  },
  fontSize: {
    tiny: 10,
    small: 12,
    regular: 14,
    medium: 16,
    large: 18,
    xlarge: 20,
    xxlarge: 24,
    huge: 32,
  },
  lineHeight: {
    tiny: 14,
    small: 16,
    regular: 20,
    medium: 24,
    large: 26,
    xlarge: 28,
    xxlarge: 32,
    huge: 40,
  },
};
