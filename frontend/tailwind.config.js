/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'game-bg': '#1a1a1a',
        'game-primary': '#4ade80',
        'game-secondary': '#3b82f6',
        'game-accent': '#f43f5e',
      },
    },
  },
  plugins: [],
} 