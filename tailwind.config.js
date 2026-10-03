/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          800: '#1E293B',
          900: '#0F172A',
        },
        sky: {
          500: '#0EA5E9',
          600: '#0284C7',
        }
      }
    },
  },
  plugins: [],
}