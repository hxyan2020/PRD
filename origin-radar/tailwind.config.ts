import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0b0f14",
          2: "#121821",
          3: "#1a2230",
        },
        paper: "#f3eee4",
        rust: {
          DEFAULT: "#e85d04",
          dim: "#c24d08",
        },
        signal: "#2dd4bf",
        gold: "#e8b86d",
        mist: "#8b97a8",
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
        mono: ["var(--font-plex)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 18px 40px -24px rgba(0,0,0,0.55)",
      },
    },
  },
  plugins: [],
};

export default config;
