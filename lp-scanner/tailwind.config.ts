import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0c1222",
        "navy-2": "#243047",
        mist: "#667084",
        foam: "#f2f5f9",
        slate: "#d8dee8",
        teal: "#1d4ed8",
        "teal-soft": "#dbeafe",
        amber: "#a16207",
        "amber-soft": "#fef3c7",
        line: "#c5cedb",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 0 rgba(12, 18, 34, 0.04), 0 12px 28px rgba(12, 18, 34, 0.06)",
      },
      keyframes: {
        rise: {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        scan: {
          "0%": { transform: "translateX(-25%)", opacity: "0.15" },
          "45%": { opacity: "0.85" },
          "100%": { transform: "translateX(125%)", opacity: "0.15" },
        },
        "accent-pulse": {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        rise: "rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        float: "float 5.5s ease-in-out infinite",
        scan: "scan 2.6s ease-in-out infinite",
        "accent-pulse": "accent-pulse 2.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
