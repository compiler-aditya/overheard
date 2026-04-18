import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm identity palette — lifted from identity.md
        parchment: "#F5EEDD",
        ember: "#D97742",
        dusk: "#2C1D1A",
        moss: "#6B7A5A",
        ink: "#1C1512",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["ui-serif", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
