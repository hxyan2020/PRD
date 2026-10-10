import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111111",
        "ink-2": "#ffffff",
        mist: "#6b6760",
        foam: "#141414",
        celadon: "#e4b72c",
        copper: "#b45309",
        chalk: "#f1ede3",
        paper: "#f1ede3",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        panel: "0 18px 40px rgba(17,17,17,0.08)",
      },
      keyframes: {
        rise: {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.45" },
          "50%": { opacity: "0.9" },
        },
        drift: {
          "0%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
          "100%": { transform: "translateY(0)" },
        },
        ken: {
          "0%": { transform: "scale(1.04) translate3d(0,0,0)" },
          "100%": { transform: "scale(1.1) translate3d(-1.5%, -1%, 0)" },
        },
      },
      animation: {
        rise: "rise 0.7s ease-out both",
        "pulse-glow": "pulseGlow 3.2s ease-in-out infinite",
        drift: "drift 6s ease-in-out infinite",
        ken: "ken 18s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
