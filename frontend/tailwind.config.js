/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e8f1fc',
          100: '#c5dcf8',
          200: '#9ec5f3',
          300: '#77aeee',
          400: '#5a9bea',
          500: '#1A73E8',
          600: '#1565d8',
          700: '#1054c4',
          800: '#0c44b0',
          900: '#062d8f',
        },
        secondary: '#FFFFFF',
        accent: '#F5F7FA',
        dark: {
          100: '#d5d7db',
          200: '#abafb7',
          300: '#808793',
          400: '#565f6f',
          500: '#2c374b',
          600: '#232c3c',
          700: '#1a212d',
          800: '#12161e',
          900: '#090b0f',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'card': '0 0 0 1px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
}