import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "#F5EFE3",
          light: "#FAF6EB",
          dark: "#ECE3D0",
          deep: "#DDD2BB",
          warm: "#F2E8D5",
          honey: "#EFE2C6",
          mist: "#EFEDE6",
        },
        ink: {
          DEFAULT: "#1F1B16",
          soft: "#4A3F33",
          mute: "#6E6155",
          faint: "#A89B8A",
          ghost: "#C9BFAE",
        },
        ochre: {
          DEFAULT: "#B8763C",
          light: "#D49A5F",
          pale: "#E6C7A0",
          dark: "#8C5824",
        },
        moss: {
          DEFAULT: "#4A5C3A",
          light: "#6E7E5B",
          pale: "#B8C4A6",
          deep: "#2F3D24",
        },
        cinnabar: {
          DEFAULT: "#A8412A",
          light: "#C9614B",
          pale: "#E8B5A8",
          dark: "#7A2D1B",
        },
        qing: {
          DEFAULT: "#3D5A6C",
          light: "#5A7A8E",
          deep: "#2A4254",
          mist: "#B8C5CC",
          pale: "#E0E6E9",
        },
        bone: "#FFFCF5",
        // Backwards-compat alias for any lingering brand-* usages — points to moss
        brand: {
          50: "#F8F4EA",
          100: "#EFE6CF",
          200: "#D6DBC2",
          300: "#B8C4A6",
          400: "#9DA888",
          500: "#4A5C3A",
          600: "#3E4E30",
          700: "#2F3D24",
          800: "#26321C",
          900: "#1B2413",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-sans-zh)",
          "var(--font-display)",
          "ui-sans-serif",
          "system-ui",
          "PingFang SC",
          "sans-serif",
        ],
        serif: [
          "var(--font-serif-zh)",
          "var(--font-display)",
          "Songti SC",
          "Georgia",
          "serif",
        ],
        display: [
          "var(--font-display)",
          "var(--font-serif-zh)",
          "Georgia",
          "serif",
        ],
        mono: [
          "var(--font-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
      letterSpacing: {
        manuscript: "0.04em",
        smallcaps: "0.18em",
      },
      boxShadow: {
        paper: "0 1px 0 0 rgba(31, 27, 22, 0.04), 0 1px 2px 0 rgba(31, 27, 22, 0.06)",
        leaf: "0 4px 18px -8px rgba(31, 27, 22, 0.18), 0 1px 3px 0 rgba(31, 27, 22, 0.06)",
        ink: "0 12px 40px -12px rgba(31, 27, 22, 0.22)",
        seal: "0 0 0 1px rgba(168, 65, 42, 0.35), inset 0 0 0 1px rgba(255, 252, 245, 0.5)",
      },
      animation: {
        "ink-pulse": "ink-pulse 1.6s ease-in-out infinite",
        "ink-bleed": "ink-bleed 0.6s ease-out both",
        "brush": "brush 0.8s ease-out both",
        "ink-drip": "ink-drip 1.4s ease-in-out infinite",
        "fade-up": "fade-up 0.4s ease-out both",
      },
      keyframes: {
        "ink-pulse": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.45)", opacity: "0.45" },
        },
        "ink-bleed": {
          "0%": { opacity: "0", transform: "translateY(8px)", filter: "blur(2px)" },
          "100%": { opacity: "1", transform: "translateY(0)", filter: "blur(0)" },
        },
        "brush": {
          "0%": { transform: "scaleX(0)", transformOrigin: "left center" },
          "100%": { transform: "scaleX(1)", transformOrigin: "left center" },
        },
        "ink-drip": {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "1" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
