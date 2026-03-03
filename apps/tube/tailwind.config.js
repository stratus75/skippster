/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tube: {
          500: '#FF0000',
          600: '#CC0000',
        },
        social: {
          500: '#1877F2',
          600: '#1464CC',
        },
      },
    },
  },
  plugins: [],
}