import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        navy: {
          DEFAULT: "#0A1628",
          light: "#0F2040",
          border: "#1A3A5C",
        },
        orange: {
          DEFAULT: "#FF6B35",
          hover: "#E55A24",
          muted: "rgba(255, 107, 53, 0.12)",
        },
        success: "#22C55E",
        error: "#EF4444",
        warning: "#F59E0B",
      },
      fontFamily: {
        display: ["Bebas Neue", "sans-serif"],
        sans: ["DM Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
