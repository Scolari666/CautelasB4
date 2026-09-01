/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          500: "#dc2626",
          600: "#c1121f",
          700: "#9d0e18",
          800: "#7f1116",
          900: "#5c0c10",
        },
        gold: {
          50: "#fefaec",
          100: "#fdf0c8",
          400: "#f2c14e",
          500: "#e0a821",
          600: "#b8860f",
        },
      },
    },
  },
  plugins: [],
};
