// Static fallbacks. The mobile app overrides every key below with
// rgb(var(--token)) so light/dark swap works; these hexes are the design
// source-of-truth values and the fallback for any consumer without CSS vars.
const colors = {
  background: '#FFFFFF',
  foreground: '#1A1C1C',
  surface: '#F9F9F9',
  'surface-elevated': '#FFFFFF',
  'surface-subtle': '#EDEDED',
  'surface-inverse': '#252525',
  card: '#FFFFFF',
  popover: '#FFFFFF',
  primary: '#00667E',
  'primary-foreground': '#FFFFFF',
  'primary-container': '#28809A',
  'on-primary-container': '#FFFFFF',
  secondary: '#EDEDED',
  'secondary-foreground': '#252525',
  accent: '#E0EEF2',
  'accent-soft': '#E0EEF2',
  'accent-foreground': '#00667E',
  border: '#D8DBDC',
  outline: '#6F797D',
  'outline-variant': '#BEC8CD',
  muted: '#EDEDED',
  'muted-foreground': '#8D9192',
  'tertiary-foreground': '#A4A8A9',
  'fill-soft': '#EDEDED',
  'fill-strong': 'rgba(37, 37, 37, 0.06)',
  success: '#34C759',
  warning: '#FFCC00',
  danger: '#FF3B30',
  'on-warning': '#1A1C1C',
};

module.exports = {
  appleHIGTailwindTheme: {
    colors,
    fontFamily: {
      sans: ['DM Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      display: ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
    },
    // 8pt-grid radii from DESIGN.md: inputs/media 12px (md), cards/buttons
    // 16px (lg), sheets 24px (xl), pills full.
    borderRadius: {
      sm: '4px',
      DEFAULT: '8px',
      md: '12px',
      lg: '16px',
      xl: '24px',
      '2xl': '32px',
      full: '9999px',
    },
    boxShadow: {
      card: '0 2px 12px rgba(37, 37, 37, 0.06)',
      floating: '0 14px 40px rgba(37, 37, 37, 0.14)',
      sidebar: '4px 0 24px rgba(0, 0, 0, 0.18)',
    },
  },
};
