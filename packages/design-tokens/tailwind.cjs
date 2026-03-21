const colors = {
  background: '#F5F5F7',
  foreground: '#1D1D1F',
  surface: 'rgba(255, 255, 255, 0.78)',
  'surface-elevated': 'rgba(255, 255, 255, 0.92)',
  'surface-subtle': '#EDEDF0',
  card: 'rgba(255, 255, 255, 0.92)',
  popover: '#FFFFFF',
  primary: '#0071E3',
  'primary-foreground': '#FFFFFF',
  secondary: 'rgba(120, 120, 128, 0.12)',
  'secondary-foreground': '#1D1D1F',
  accent: '#0071E3',
  border: 'rgba(60, 60, 67, 0.18)',
  muted: 'rgba(120, 120, 128, 0.12)',
  'muted-foreground': '#6E6E73',
  'tertiary-foreground': '#86868B',
  'fill-soft': 'rgba(120, 120, 128, 0.12)',
  'fill-strong': 'rgba(120, 120, 128, 0.2)',
  success: '#34C759',
  warning: '#FF9F0A',
  danger: '#FF3B30',
};

module.exports = {
  appleHIGTailwindTheme: {
    colors,
    borderRadius: {
      sm: '10px',
      md: '14px',
      lg: '18px',
      xl: '24px',
      '2xl': '32px',
      full: '9999px',
    },
    boxShadow: {
      card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 12px 32px rgba(15, 23, 42, 0.06)',
      floating: '0 4px 12px rgba(15, 23, 42, 0.06), 0 24px 48px rgba(15, 23, 42, 0.1)',
    },
  },
};
