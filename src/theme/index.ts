import { colors, useThemeColors } from './colors';
import { spacing } from './spacing';
import { typography } from './typography';

export const theme = {
  colors,
  spacing,
  typography,
};

export type Theme = typeof theme;

export function useTheme() {
  const themeColors = useThemeColors();
  return {
    colors: themeColors,
    spacing,
    typography,
  };
}

export * from './colors';
export * from './spacing';
export * from './typography';

