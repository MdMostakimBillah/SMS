/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Hind Siliguri", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        brand:       { DEFAULT: "var(--brand)", light: "var(--brand-light)", 2: "var(--brand-2)" },
        teal:        { DEFAULT: "var(--teal)", light: "var(--teal-light)" },
        green:       { DEFAULT: "var(--green)", light: "var(--green-light)" },
        red:         { DEFAULT: "var(--red)", light: "var(--red-light)" },
        amber:       { DEFAULT: "var(--amber)", light: "var(--amber-light)" },
        purple:      { DEFAULT: "var(--purple)", light: "var(--purple-light)" },
        surface:     { DEFAULT: "var(--surface)", 2: "var(--surface-2)" },
        card:        { blue: "var(--card-blue)", yellow: "var(--card-yellow)", green: "var(--card-green)", purple: "var(--card-purple)" },
      },
      boxShadow: {
        xs: "var(--shadow-xs)", sm: "var(--shadow-sm)", md: "var(--shadow-md)", lg: "var(--shadow-lg)",
      },
    },
  },
  plugins: [],
}
