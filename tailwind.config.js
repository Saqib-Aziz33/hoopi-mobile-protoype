const { platformSelect } = require("nativewind/theme");
const steps = [0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const scale = (name) =>
  Object.fromEntries(
    steps.map((step) => [
      step,
      `rgb(var(--color-${name}-${step}) / <alpha-value>)`,
    ]),
  );

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: scale("primary"),
        secondary: scale("secondary"),
        tertiary: scale("tertiary"),
        error: scale("error"),
        success: scale("success"),
        warning: scale("warning"),
        info: scale("info"),
        typography: scale("typography"),
        outline: scale("outline"),
        background: {
          ...scale("background"),
          ...Object.fromEntries(
            ["error", "warning", "success", "muted", "info"].map((name) => [
              name,
              `rgb(var(--color-background-${name}) / <alpha-value>)`,
            ]),
          ),
        },
        indicator: {
          ...Object.fromEntries(
            ["primary", "info", "error"].map((name) => [
              name,
              `rgb(var(--color-indicator-${name}) / <alpha-value>)`,
            ]),
          ),
        },
      },
      fontFamily: {
        editorial: ["Lora"],
        "editorial-italic": ["LoraItalic"],
        body: platformSelect({
          ios: "System",
          android: "sans-serif",
          default: "system-ui, sans-serif",
        }),
        heading: platformSelect({
          ios: "System",
          android: "sans-serif",
          default: "system-ui, sans-serif",
        }),
        mono: platformSelect({
          ios: "Menlo",
          android: "monospace",
          default: "monospace",
        }),
      },
      fontSize: { "2xs": "10px" },
    },
  },
  plugins: [],
};
