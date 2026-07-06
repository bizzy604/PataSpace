const { appleHIGTailwindTheme } = require('../../packages/design-tokens/tailwind.cjs');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./App.tsx', './global.css', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      ...appleHIGTailwindTheme,
      colors: {
        ...appleHIGTailwindTheme.colors,
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-elevated': 'rgb(var(--surface-elevated) / <alpha-value>)',
        'surface-subtle': 'rgb(var(--surface-subtle) / <alpha-value>)',
        'surface-inverse': 'rgb(var(--surface-inverse) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        popover: 'rgb(var(--popover) / <alpha-value>)',
        primary: 'rgb(var(--primary) / <alpha-value>)',
        'primary-foreground': 'rgb(var(--primary-foreground) / <alpha-value>)',
        'primary-container': 'rgb(var(--primary-container) / <alpha-value>)',
        'on-primary-container': 'rgb(var(--on-primary-container) / <alpha-value>)',
        secondary: 'rgb(var(--secondary) / <alpha-value>)',
        'secondary-foreground': 'rgb(var(--secondary-foreground) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-soft': 'rgb(var(--accent-soft) / <alpha-value>)',
        'accent-foreground': 'rgb(var(--accent-foreground) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        outline: 'rgb(var(--outline) / <alpha-value>)',
        'outline-variant': 'rgb(var(--outline-variant) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        'muted-foreground': 'rgb(var(--muted-foreground) / <alpha-value>)',
        'tertiary-foreground': 'rgb(var(--tertiary-foreground) / <alpha-value>)',
        'fill-soft': 'rgb(var(--fill-soft) / <alpha-value>)',
        'fill-strong': 'rgb(var(--fill-strong) / <alpha-value>)',
        success: 'rgb(var(--success) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
        'on-warning': 'rgb(var(--on-warning) / <alpha-value>)',
      },
      // Registered font families (see src/app/_layout.tsx useFonts). On RN each
      // weight is its own family name, so weight = family, not fontWeight.
      fontFamily: {
        display: ['Poppins_700Bold'],
        'display-semibold': ['Poppins_600SemiBold'],
        sans: ['DMSans_400Regular'],
        body: ['DMSans_400Regular'],
        'body-medium': ['DMSans_500Medium'],
        'body-bold': ['DMSans_700Bold'],
      },
      // Typography scale from DESIGN.md, as [fontSize, lineHeight]. Names match
      // the mockup class names so screen restyles translate 1:1.
      fontSize: {
        'display-01': ['48px', '56px'],
        'display-02': ['34px', '41px'],
        'headline-lg': ['28px', '34px'],
        'headline-md': ['24px', '30px'],
        'headline-sm': ['20px', '25px'],
        'body-lg': ['17px', '24px'],
        'body-md': ['15px', '21px'],
        'label-md': ['13px', '18px'],
        caption: ['11px', '14px'],
      },
    },
  },
  plugins: [],
};
