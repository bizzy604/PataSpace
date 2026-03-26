const colors = {
  background: '#FFFFFF',
  foreground: '#252525',
  surface: '#EDEDED',
  'surface-elevated': '#FFFFFF',
  'surface-subtle': '#EDEDED',
  'surface-inverse': '#252525',
  card: '#FFFFFF',
  popover: '#FFFFFF',
  primary: '#28809A',
  'primary-foreground': '#FFFFFF',
  secondary: '#EDEDED',
  'secondary-foreground': '#252525',
  accent: '#28809A',
  'accent-soft': 'rgba(40, 128, 154, 0.14)',
  border: 'rgba(37, 37, 37, 0.08)',
  muted: '#EDEDED',
  'muted-foreground': '#8D9192',
  'tertiary-foreground': '#8D9192',
  'fill-soft': '#EDEDED',
  'fill-strong': 'rgba(37, 37, 37, 0.06)',
  success: '#2D9D78',
  warning: '#D89A3D',
  danger: '#D35D5D',
};

module.exports = {
  appleHIGTailwindTheme: {
    colors,
    fontFamily: {
      sans: ['DM Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      display: ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
    },
    borderRadius: {
      sm: '10px',
      md: '14px',
      lg: '18px',
      xl: '24px',
      '2xl': '32px',
      full: '9999px',
    },
    boxShadow: {
      card: '0 6px 24px rgba(37, 37, 37, 0.08)',
      floating: '0 14px 40px rgba(37, 37, 37, 0.12)',
      sidebar: '4px 0 24px rgba(0, 0, 0, 0.18)',
    },
  },
};
