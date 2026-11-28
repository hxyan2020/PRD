import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0a1628",
        "ink-soft": "#1a2d4a",
        mist: "#5c6f88",
        paper: "#f3f6fa",
        foam: "#e8eef6",
        signal: "#0d9488",
        "signal-bright": "#14b8a6",
        "signal-soft": "#ccfbf1",
        ember: "#c45c26",
        line: "#c8d4e3",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      keyframes: {
        rise: {
          from: { opacity: "0", transform: "translateY(18px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        countPulse: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.02)" },
        },
        scanLine: {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "20%": { opacity: "0.5" },
          "100%": { transform: "translateY(100%)", opacity: "0" },
        },
        drift: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(12px, -8px)" },
        },
      },
      animation: {
        rise: "rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
        "count-pulse": "countPulse 3.5s ease-in-out infinite",
        "scan-line": "scanLine 4s ease-in-out infinite",
        drift: "drift 14s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
