import { useColorScheme, StyleSheet } from 'react-native';
import { useAppSelector } from '../store/hooks';
import { ThemeMode } from '../store/slices/settingsSlice';
import { RootState } from '../store';

export interface ThemeColors {
  primaryBackground: string;
  secondaryBackground: string;
  cardBackground: string;
  inputBackground: string;
  primaryAccent: string;
  accentMuted: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  divider: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  white: string;
  black: string;
  transparent: string;
  messageStatus: {
    sent: string;
    delivered: string;
    read: string;
  };
  online: string;
  offline: string;
  bubbleMine: string;
  bubbleOther: string;
}

export const themes: Record<'dark' | 'light' | 'teal' | 'emerald' | 'slate', ThemeColors> = {
  dark: {
    primaryBackground: '#0B1120',
    secondaryBackground: '#111827',
    cardBackground: '#1F2937',
    inputBackground: '#1A2332',
    primaryAccent: '#06B6D4',
    accentMuted: 'rgba(6, 182, 212, 0.15)',
    textPrimary: '#F9FAFB',
    textSecondary: '#9CA3AF',
    textTertiary: '#6B7280',
    divider: '#1F2937',
    border: '#374151',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#06B6D4',
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
    messageStatus: {
      sent: '#9CA3AF',
      delivered: '#9CA3AF',
      read: '#06B6D4',
    },
    online: '#10B981',
    offline: '#6B7280',
    bubbleMine: '#164E63',
    bubbleOther: '#1F2937',
  },
  light: {
    primaryBackground: '#F8FAFC',
    secondaryBackground: '#F1F5F9',
    cardBackground: '#FFFFFF',
    inputBackground: '#E2E8F0',
    primaryAccent: '#3B82F6',
    accentMuted: 'rgba(59, 130, 246, 0.15)',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textTertiary: '#64748B',
    divider: '#E2E8F0',
    border: '#CBD5E1',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
    messageStatus: {
      sent: '#64748B',
      delivered: '#64748B',
      read: '#3B82F6',
    },
    online: '#10B981',
    offline: '#64748B',
    bubbleMine: '#3B82F6',
    bubbleOther: '#E2E8F0',
  },
  teal: {
    primaryBackground: '#031417',
    secondaryBackground: '#052226',
    cardBackground: '#083238',
    inputBackground: '#062B30',
    primaryAccent: '#14B8A6',
    accentMuted: 'rgba(20, 184, 166, 0.15)',
    textPrimary: '#F0FDFA',
    textSecondary: '#99F6E4',
    textTertiary: '#2DD4BF',
    divider: '#083238',
    border: '#0D9488',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#14B8A6',
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
    messageStatus: {
      sent: '#99F6E4',
      delivered: '#99F6E4',
      read: '#14B8A6',
    },
    online: '#10B981',
    offline: '#0D9488',
    bubbleMine: '#0F766E',
    bubbleOther: '#083238',
  },
  emerald: {
    primaryBackground: '#02140F',
    secondaryBackground: '#04221A',
    cardBackground: '#083529',
    inputBackground: '#052D22',
    primaryAccent: '#10B981',
    accentMuted: 'rgba(16, 185, 129, 0.15)',
    textPrimary: '#ECFDF5',
    textSecondary: '#A7F3D0',
    textTertiary: '#34D399',
    divider: '#083529',
    border: '#059669',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#10B981',
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
    messageStatus: {
      sent: '#A7F3D0',
      delivered: '#A7F3D0',
      read: '#10B981',
    },
    online: '#10B981',
    offline: '#059669',
    bubbleMine: '#047857',
    bubbleOther: '#083529',
  },
  slate: {
    primaryBackground: '#0F172A',
    secondaryBackground: '#1E293B',
    cardBackground: '#334155',
    inputBackground: '#1E293B',
    primaryAccent: '#6366F1',
    accentMuted: 'rgba(99, 102, 241, 0.15)',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    divider: '#1E293B',
    border: '#475569',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#6366F1',
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
    messageStatus: {
      sent: '#94A3B8',
      delivered: '#94A3B8',
      read: '#6366F1',
    },
    online: '#10B981',
    offline: '#475569',
    bubbleMine: '#4F46E5',
    bubbleOther: '#1E293B',
  },
};

export function getThemeColors(themeMode: ThemeMode, systemScheme: 'light' | 'dark' = 'dark'): ThemeColors {
  if (themeMode === 'system') {
    return themes[systemScheme] || themes.dark;
  }
  return themes[themeMode] || themes.dark;
}

export function useThemeColors(): ThemeColors {
  const themeMode = useAppSelector((state: RootState) => state.settings.theme);
  const scheme = useColorScheme();
  const systemScheme = (scheme === 'light' || scheme === 'dark') ? scheme : 'dark';
  return getThemeColors(themeMode, systemScheme);
}

// ── Dynamic Stylesheet Registry ──────────────────────────────────────────────
const registeredStylesheets: Array<{
  stylesheet: any;
  styleCreator: (colors: ThemeColors) => any;
}> = [];

let currentColors = themes.dark;

export function createThemedStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  styleCreator: (colors: ThemeColors) => T
): { [P in keyof T]: any } {
  const initialStyles = StyleSheet.create(styleCreator(currentColors) as any);
  const stylesheet = { ...initialStyles } as any;
  registeredStylesheets.push({ stylesheet, styleCreator });
  return stylesheet;
}

export function updateThemeStyles(newColors: ThemeColors) {
  currentColors = newColors;
  for (const item of registeredStylesheets) {
    const newStyles = StyleSheet.create(item.styleCreator(newColors));
    // Clear old keys
    for (const key of Object.keys(item.stylesheet)) {
      delete item.stylesheet[key];
    }
    // Assign new styles
    Object.assign(item.stylesheet, newStyles);
  }
}

// Static fallback for legacy code
export const colors = themes.dark;
