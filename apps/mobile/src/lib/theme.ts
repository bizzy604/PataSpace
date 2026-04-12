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
  primary: string;
  primaryForeground: string;
  accentSoft: string;
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
    foreground: '#252525',
    mutedForeground: '#8D9192',
    tertiaryForeground: '#A4A8A9',
    surface: '#F7F8F8',
    surfaceElevated: '#FFFFFF',
    surfaceSubtle: '#EDEDED',
    surfaceInverse: '#252525',
    card: '#FFFFFF',
    border: '#D8DBDC',
    primary: '#28809A',
    primaryForeground: '#FFFFFF',
    accentSoft: '#E8F3F7',
    shadowColor: '#252525',
    inputPlaceholder: '#8D9192',
    authGlow: 'rgba(40, 128, 154, 0.12)',
    authPanelGlow: 'rgba(40, 128, 154, 0.16)',
    authBackdropA: 'rgba(40, 128, 154, 0.08)',
    authBackdropB: 'rgba(40, 128, 154, 0.06)',
    toggleTrack: '#FFFFFF',
    toggleBorder: '#D8DBDC',
    toggleThumb: '#28809A',
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
    primary: '#28809A',
    primaryForeground: '#FFFFFF',
    accentSoft: '#1F3E48',
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
