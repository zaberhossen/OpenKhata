import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
          dark: "rgb(var(--color-primary-dark) / <alpha-value>)",
          light: "rgb(var(--color-primary-light) / <alpha-value>)",
        },
        got: {
          DEFAULT: "rgb(var(--color-got) / <alpha-value>)",
          light: "rgb(var(--color-got-light) / <alpha-value>)",
        },
        gave: {
          DEFAULT: "rgb(var(--color-gave) / <alpha-value>)",
          light: "rgb(var(--color-gave-light) / <alpha-value>)",
        },
        chart: {
          got: "rgb(var(--color-chart-got) / <alpha-value>)",
          gave: "rgb(var(--color-chart-gave) / <alpha-value>)",
        },
        background: "rgb(var(--color-background) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        text: {
          DEFAULT: "rgb(var(--color-text) / <alpha-value>)",
          muted: "rgb(var(--color-text-muted) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["Noto Sans Bengali", "Hind Siliguri", "system-ui", "sans-serif"],
      },
      minHeight: {
        tap: "var(--tap-target-min)",
      },
      minWidth: {
        tap: "var(--tap-target-min)",
      },
    },
  },
  plugins: [],
};
export default config;
