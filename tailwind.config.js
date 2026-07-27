/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        charcoal: {
          DEFAULT: '#0A0A0A',
          card: '#121212',
          surface: '#1A1A1A',
          border: '#262626',
          hover: '#1F1F1F',
        },
        offwhite: {
          DEFAULT: '#F5F5F7',
          muted: '#A1A1AA',
          dim: '#71717A',
        },
        sea: {
          DEFAULT: '#0EA5E9',
          light: '#38BDF8',
          dark: '#0284C7',
          glow: 'rgba(14, 165, 233, 0.15)',
        },
        mint: {
          DEFAULT: '#10B981',
          light: '#34D399',
          dark: '#059669',
          glow: 'rgba(16, 185, 129, 0.15)',
        },
        brand: {
          bg: '#0A0A0A',
          card: '#121212',
          text: '#F5F5F7',
          sea: '#0EA5E9',
          mint: '#10B981',
        },
      },
    },
  },
  plugins: [],
};
