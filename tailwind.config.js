/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        coral: {
          DEFAULT: '#FF9A8B',
          light: '#FFB8A8',
          dark: '#FF7A6B',
        },
        pink: {
          DEFAULT: '#FFB8D8',
          light: '#FFD4E8',
          dark: '#FFA8C8',
        },
        rose: {
          DEFAULT: '#FF6A88',
          light: '#FF99AC',
          dark: '#FF4A68',
        },
        peach: {
          DEFAULT: '#FFC4A0',
          light: '#FFD9B3',
          dark: '#FFAF8D',
        },
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Articulat CF', 'system-ui', '-apple-system', 'sans-serif'],
        body: ['Geist', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'heading': ['56px', { lineHeight: '1.2', letterSpacing: '0.02em', fontWeight: '800' }],
        'heading-lg': ['64px', { lineHeight: '1.2', letterSpacing: '0.02em', fontWeight: '800' }],
        'heading-sm': ['48px', { lineHeight: '1.2', letterSpacing: '0.02em', fontWeight: '800' }],
        'subheading': ['26px', { lineHeight: '1.4', letterSpacing: '0.01em', fontWeight: '800' }],
        'subheading-lg': ['28px', { lineHeight: '1.4', letterSpacing: '0.01em', fontWeight: '800' }],
        'subheading-sm': ['24px', { lineHeight: '1.4', letterSpacing: '0.01em', fontWeight: '800' }],
      },
      letterSpacing: {
        'expanded': '0.02em',
        'slightly-expanded': '0.01em',
      },
    }
  },
  plugins: [],
};
