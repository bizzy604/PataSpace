import type { StatusBarStyle } from 'expo-status-bar';

export type AppColorScheme = 'light' | 'dark';

export type MobileThemePalette = {
  mode: AppColorScheme;
  background: string;
  foreground: string;
  mutedForeground: string;
  tertiaryForeground: string;
  surface: string;
  surfaceElevated: string;
  surfaceSubtle: string;
  surfaceInverse: string;
  card: string;
  border: string;
  outline: string;
  primary: string;
  primaryForeground: string;
  primaryContainer: string;
  accentSoft: string;
  success: string;
  warning: string;
  danger: string;
  shadowColor: string;
  inputPlaceholder: string;
  authGlow: string;
  authPanelGlow: string;
  authBackdropA: string;
  authBackdropB: string;
  toggleTrack: string;
  toggleBorder: string;
  toggleThumb: string;
  statusBarStyle: StatusBarStyle;
};

export const mobileThemes: Record<AppColorScheme, MobileThemePalette> = {
  light: {
    mode: 'light',
    background: '#FFFFFF',
    foreground: '#1A1C1C',
    mutedForeground: '#8D9192',
    tertiaryForeground: '#A4A8A9',
    surface: '#F9F9F9',
    surfaceElevated: '#FFFFFF',
    surfaceSubtle: '#EDEDED',
    surfaceInverse: '#252525',
    card: '#FFFFFF',
    border: '#D8DBDC',
    outline: '#6F797D',
    primary: '#00667E',
    primaryForeground: '#FFFFFF',
    primaryContainer: '#28809A',
    accentSoft: '#E0EEF2',
    success: '#34C759',
    warning: '#FFCC00',
    danger: '#FF3B30',
    shadowColor: '#252525',
    inputPlaceholder: '#8D9192',
    authGlow: 'rgba(0, 102, 126, 0.12)',
    authPanelGlow: 'rgba(0, 102, 126, 0.16)',
    authBackdropA: 'rgba(0, 102, 126, 0.08)',
    authBackdropB: 'rgba(0, 102, 126, 0.06)',
    toggleTrack: '#FFFFFF',
    toggleBorder: '#D8DBDC',
    toggleThumb: '#00667E',
    statusBarStyle: 'dark',
  },
  dark: {
    mode: 'dark',
    background: '#121415',
    foreground: '#F5F7F8',
    mutedForeground: '#A0A7AA',
    tertiaryForeground: '#7F8688',
    surface: '#171A1B',
    surfaceElevated: '#1C2021',
    surfaceSubtle: '#232728',
    surfaceInverse: '#252525',
    card: '#1C2021',
    border: '#313739',
    outline: '#8F999D',
    primary: '#28809A',
    primaryForeground: '#FFFFFF',
    primaryContainer: '#00667E',
    accentSoft: '#1F3E48',
    success: '#34C759',
    warning: '#FFCC00',
    danger: '#FF5A50',
    shadowColor: '#000000',
    inputPlaceholder: '#8D9192',
    authGlow: 'rgba(40, 128, 154, 0.18)',
    authPanelGlow: 'rgba(40, 128, 154, 0.22)',
    authBackdropA: 'rgba(40, 128, 154, 0.12)',
    authBackdropB: 'rgba(40, 128, 154, 0.08)',
    toggleTrack: '#171A1B',
    toggleBorder: '#313739',
    toggleThumb: '#28809A',
    statusBarStyle: 'light',
  },
};
