import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0c1520",
        "ink-2": "#152435",
        "ink-3": "#1e3348",
        paper: "#eef3f7",
        mist: "#6b7f92",
        line: "#c8d4e0",
        copper: "#b45309",
        "copper-soft": "#ffedd5",
        sea: "#0e7490",
        "sea-soft": "#cffafe",
        danger: "#b91c1c",
        ok: "#047857",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      keyframes: {
        rise: {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseLine: {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "1" },
        },
        flow: {
          "0%": { strokeDashoffset: "24" },
          "100%": { strokeDashoffset: "0" },
        },
      },
      animation: {
        rise: "rise 0.5s ease-out both",
        "pulse-line": "pulseLine 2.4s ease-in-out infinite",
        flow: "flow 1.2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
