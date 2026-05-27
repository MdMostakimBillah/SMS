/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        brand: {
          DEFAULT: "#534AB7",
          light: "#EEEDFE",
          dark: "#3C3489",
        },
      },
    },
  },
  plugins: [],
}
