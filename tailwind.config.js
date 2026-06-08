/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf8e8',
          100: '#faefc5',
          200: '#f0dc8a',
          500: '#d4af37',
          600: '#bf9b2f',
          700: '#a98729',
          800: '#8c6f20',
          900: '#6b5419',
        },
        sidebar: {
          DEFAULT: '#111111',
          soft: '#1b1b1b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
