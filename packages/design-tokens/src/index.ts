export const appleHIGTokens = {
  fontFamily: {
    sans:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
    display:
      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
  },
  color: {
    background: {
      canvas: '#F5F5F7',
      subtle: '#EDEDF0',
      strong: '#E3E4E8',
    },
    surface: {
      translucent: 'rgba(255, 255, 255, 0.78)',
      elevated: 'rgba(255, 255, 255, 0.92)',
      solid: '#FFFFFF',
      inverse: '#1C1C1E',
    },
    text: {
      primary: '#1D1D1F',
      secondary: '#6E6E73',
      tertiary: '#86868B',
      inverse: '#FFFFFF',
    },
    border: {
      subtle: 'rgba(60, 60, 67, 0.18)',
      strong: 'rgba(60, 60, 67, 0.29)',
    },
    fill: {
      soft: 'rgba(120, 120, 128, 0.12)',
      strong: 'rgba(120, 120, 128, 0.2)',
      accent: 'rgba(0, 113, 227, 0.12)',
    },
    accent: {
      primary: '#0071E3',
      hover: '#0062C4',
      foreground: '#FFFFFF',
    },
    status: {
      success: '#34C759',
      warning: '#FF9F0A',
      danger: '#FF3B30',
    },
  },
  radius: {
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    '2xl': 32,
    full: 999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
    '3xl': 48,
    '4xl': 64,
  },
  typography: {
    display: {
      fontSize: 56,
      lineHeight: 60,
      letterSpacing: -1.6,
      fontWeight: '700',
    },
    hero: {
      fontSize: 40,
      lineHeight: 44,
      letterSpacing: -1.1,
      fontWeight: '700',
    },
    title1: {
      fontSize: 32,
      lineHeight: 38,
      letterSpacing: -0.8,
      fontWeight: '700',
    },
    title2: {
      fontSize: 24,
      lineHeight: 30,
      letterSpacing: -0.4,
      fontWeight: '700',
    },
    title3: {
      fontSize: 20,
      lineHeight: 24,
      letterSpacing: -0.2,
      fontWeight: '600',
    },
    headline: {
      fontSize: 17,
      lineHeight: 22,
      letterSpacing: -0.2,
      fontWeight: '600',
    },
    body: {
      fontSize: 17,
      lineHeight: 25,
      letterSpacing: -0.1,
      fontWeight: '400',
    },
    callout: {
      fontSize: 16,
      lineHeight: 22,
      letterSpacing: -0.1,
      fontWeight: '500',
    },
    footnote: {
      fontSize: 13,
      lineHeight: 18,
      letterSpacing: 0,
      fontWeight: '500',
    },
    caption: {
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.4,
      fontWeight: '600',
    },
  },
  motion: {
    fast: 120,
    normal: 180,
    slow: 280,
    standard: 'cubic-bezier(0.32, 0.72, 0, 1)',
    emphasized: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  },
  shadow: {
    sm: '0 1px 2px rgba(15, 23, 42, 0.04), 0 12px 32px rgba(15, 23, 42, 0.06)',
    md: '0 4px 12px rgba(15, 23, 42, 0.06), 0 24px 48px rgba(15, 23, 42, 0.1)',
    lg: '0 18px 60px rgba(15, 23, 42, 0.14)',
  },
} as const;

export const appleHIGNativeTheme = {
  screen: {
    backgroundColor: appleHIGTokens.color.background.canvas,
  },
  card: {
    backgroundColor: appleHIGTokens.color.surface.elevated,
    borderColor: appleHIGTokens.color.border.subtle,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },
  insetCard: {
    backgroundColor: appleHIGTokens.color.fill.soft,
    borderColor: appleHIGTokens.color.border.subtle,
  },
  text: {
    primary: { color: appleHIGTokens.color.text.primary },
    secondary: { color: appleHIGTokens.color.text.secondary },
    tertiary: { color: appleHIGTokens.color.text.tertiary },
    inverse: { color: appleHIGTokens.color.text.inverse },
    accent: { color: appleHIGTokens.color.accent.primary },
  },
} as const;

export type AppleHIGTokens = typeof appleHIGTokens;
