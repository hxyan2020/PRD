import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#e8eef6",
        "ink-soft": "#a8b4c4",
        mist: "#6b7a8d",
        paper: "#0a0e13",
        foam: "#121820",
        panel: "#151c26",
        signal: "#5ce1c3",
        "signal-bright": "#8af0d8",
        "signal-soft": "rgba(92, 225, 195, 0.12)",
        ember: "#c9782a",
        "ember-soft": "rgba(201, 120, 42, 0.14)",
        line: "#2a3544",
        "line-bright": "#3d4f63",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        hud: "0 0 0 1px rgba(92, 225, 195, 0.18), inset 0 0 0 1px rgba(92, 225, 195, 0.06)",
        panel: "inset 0 1px 0 rgba(255,255,255,0.04), 0 12px 40px rgba(0,0,0,0.35)",
      },
      keyframes: {
        rise: {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        countPulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.88" },
        },
        scanSweep: {
          "0%": { transform: "translateX(-30%)", opacity: "0" },
          "15%": { opacity: "0.55" },
          "100%": { transform: "translateX(130%)", opacity: "0" },
        },
        gearSpin: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "92%": { opacity: "1" },
          "93%": { opacity: "0.65" },
          "94%": { opacity: "1" },
          "97%": { opacity: "0.8" },
        },
        hatchDrift: {
          "0%": { backgroundPosition: "0 0, 0 0" },
          "100%": { backgroundPosition: "24px 24px, -24px 24px" },
        },
      },
      animation: {
        rise: "rise 0.65s cubic-bezier(0.22, 1, 0.36, 1) both",
        "count-pulse": "countPulse 4s ease-in-out infinite",
        "scan-sweep": "scanSweep 5.5s ease-in-out infinite",
        "gear-spin": "gearSpin 48s linear infinite",
        flicker: "flicker 6s linear infinite",
        "hatch-drift": "hatchDrift 28s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
