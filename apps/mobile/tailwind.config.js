const { appleHIGTailwindTheme } = require('../../packages/design-tokens/tailwind.cjs');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: appleHIGTailwindTheme,
  },
  plugins: [],
};
