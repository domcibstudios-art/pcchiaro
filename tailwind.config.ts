import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1d4ed8", // Blu Cobalto primario
          hover: "#1e40af",   // Blu scuro hover
          light: "#dbeafe",   // Blu tenue per container/badge
          dark: "#172554",
        },
        surface: {
          canvas: "#f8fafc",
          card: "#ffffff",
          muted: "#f1f5f9",
        },
        status: {
          danger: "#991b1b",
          dangerBg: "#fef2f2",
          dangerBorder: "#f87171",
          warning: "#92400e",
          warningBg: "#fffbeb",
          warningBorder: "#fbbf24",
          success: "#065f46",
          successBg: "#ecfdf5",
          successBorder: "#34d399",
          info: "#0369a1",
          infoBg: "#f0f9ff",
          infoBorder: "#7dd3fc",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        headline: ["var(--font-hanken)", "Hanken Grotesk", "sans-serif"],
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
