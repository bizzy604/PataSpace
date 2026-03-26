export const appleHIGTokens = {
  fontFamily: {
    sans:
      '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    display:
      '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  color: {
    background: {
      canvas: '#FFFFFF',
      subtle: '#EDEDED',
      strong: '#D8DBDC',
    },
    surface: {
      translucent: 'rgba(255, 255, 255, 0.92)',
      elevated: '#FFFFFF',
      solid: '#FFFFFF',
      inverse: '#252525',
    },
    text: {
      primary: '#252525',
      secondary: '#8D9192',
      tertiary: '#8D9192',
      inverse: '#FFFFFF',
    },
    border: {
      subtle: 'rgba(37, 37, 37, 0.08)',
      strong: 'rgba(37, 37, 37, 0.16)',
    },
    fill: {
      soft: '#EDEDED',
      strong: 'rgba(37, 37, 37, 0.06)',
      accent: 'rgba(40, 128, 154, 0.14)',
    },
    accent: {
      primary: '#28809A',
      hover: '#1F677C',
      foreground: '#FFFFFF',
    },
    status: {
      success: '#2D9D78',
      warning: '#D89A3D',
      danger: '#D35D5D',
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
    shadowColor: '#252525',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
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
