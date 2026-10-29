/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./contexts/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#10b981", // vibrant emerald
          500: "#059669",
          600: "#047857",
          700: "#065f46",
          800: "#064e3b",
          900: "#022c22",
        },
        volt: {
          300: "#bef264",
          400: "#a3e635", // electric volt
          500: "#84cc16",
        },
        cyan: {
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
        },
        amber: {
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b", // prime-time warm glow
          600: "#d97706",
        },
        razorpay: {
          light: "#528ff0",
          DEFAULT: "#0c2340",
          blue: "#3399cc",
          dark: "#081628",
        },
        dark: {
          950: "#070b14", // deepest stadium midnight obsidian
          900: "#0c1322", // main dark background
          850: "#111a2e", // card background
          800: "#17233d", // card hover & elevated surface
          750: "#1e2c4d", // modal & popover
          700: "#28395f", // border & divider
          600: "#3d5282", // subtle text / line
          500: "#5871a8",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        "glow-emerald": "0 0 25px -4px rgba(16, 185, 129, 0.3)",
        "glow-sm": "0 0 15px -3px rgba(16, 185, 129, 0.25)",
        "glow-volt": "0 0 25px -4px rgba(163, 230, 53, 0.3)",
        "glow-cyan": "0 0 25px -4px rgba(6, 182, 212, 0.3)",
        "glow-amber": "0 0 25px -4px rgba(245, 158, 11, 0.25)",
        "glow-razorpay": "0 0 25px -4px rgba(51, 153, 204, 0.35)",
        "card-elevated": "0 10px 30px -10px rgba(0, 0, 0, 0.5), 0 0 1px 1px rgba(255, 255, 255, 0.05)",
      },
    },
  },
  plugins: [],
};
