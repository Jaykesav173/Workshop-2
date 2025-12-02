/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'header-blue': '#007bff', 
        'tab-blue': '#79c7ff',   
        'input-bg': '#f2f2f2', 
      },
    },
  },
  plugins: [],
}
