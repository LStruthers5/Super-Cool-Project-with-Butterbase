import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14182B",
        slatebg: "#F2F4F9",
        card: "#FFFFFF",
        fit: "#0FA47F",
        fitsoft: "#E3F4EE",
        risk: "#E0533D",
        risksoft: "#FBE7E2",
        amber: "#E6A23C",
        muted: "#6B7186",
        hair: "#E4E7F0",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,24,43,0.04), 0 8px 24px rgba(20,24,43,0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
