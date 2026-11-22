import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0b1f33",
        "navy-2": "#14304a",
        mist: "#5a6b7c",
        foam: "#f4f7fa",
        slate: "#d7e0ea",
        teal: "#0f766e",
        "teal-soft": "#ccfbf1",
        amber: "#c2410c",
        "amber-soft": "#ffedd5",
        line: "#c5d0db",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        panel: "0 20px 50px rgba(11, 31, 51, 0.08)",
      },
      keyframes: {
        rise: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        scan: {
          "0%": { transform: "translateX(-20%)", opacity: "0.2" },
          "50%": { opacity: "0.7" },
          "100%": { transform: "translateX(120%)", opacity: "0.2" },
        },
      },
      animation: {
        rise: "rise 0.55s ease-out both",
        float: "float 5s ease-in-out infinite",
        scan: "scan 2.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
