/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'cl-navy': '#0D1B2E',
        'cl-navy-mid': '#162540',
        'cl-navy-card': '#1A2E4A',
        'cl-gold': '#C9A84C',
        'cl-gold-light': '#E8D5A3',
        'cl-gold-dim': '#8B6F35',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', '"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
