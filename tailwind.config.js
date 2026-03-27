/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary:   { DEFAULT: '#CC0000', dark: '#aa0000', light: '#e60000' },
        brand:     { DEFAULT: '#111111', light: '#1a1a1a' },
        steel:     { DEFAULT: '#2a2a2a', light: '#3d3d3d' },
      },
      fontFamily: {
        sans:    ['Inter', 'sans-serif'],
        display: ['Anton', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'metal-gradient': 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
      },
    },
  },
  plugins: [],
}
