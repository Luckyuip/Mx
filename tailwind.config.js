/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mxBlue: '#1E88E5',
        mxDark: '#121212',
        mxCard: '#1E1E1E'
      }
    },
  },
  plugins: [],
}
