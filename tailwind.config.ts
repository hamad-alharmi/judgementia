import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        legal: ["var(--font-legal)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      animation: {
        "scales-tilt": "scales-tilt 2.4s ease-in-out infinite",
        "gavel-slam": "gavel-slam 0.55s cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards",
        "screen-shake": "screen-shake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97)",
      },
      keyframes: {
        "scales-tilt": {
          "0%, 100%": { transform: "rotate(-6deg)" },
          "50%": { transform: "rotate(6deg)" },
        },
        "gavel-slam": {
          "0%": { transform: "translateY(-120%) rotate(-12deg)" },
          "70%": { transform: "translateY(8%) rotate(4deg)" },
          "100%": { transform: "translateY(0) rotate(0deg)" },
        },
        "screen-shake": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "10%": { transform: "translate(-4px, 2px)" },
          "20%": { transform: "translate(4px, -2px)" },
          "30%": { transform: "translate(-6px, -1px)" },
          "40%": { transform: "translate(6px, 1px)" },
          "50%": { transform: "translate(-3px, 2px)" },
          "60%": { transform: "translate(3px, -1px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
