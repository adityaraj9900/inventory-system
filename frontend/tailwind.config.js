/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: "#EEF1EF",
        surface: "#FFFFFF",
        ink: "#14181B",
        muted: "#5B6670",
        border: "#D9DFDB",
        primary: {
          DEFAULT: "#1F6F54",
          dark: "#15543F",
          light: "#E6F0EB",
        },
        alert: {
          DEFAULT: "#C2410C",
          light: "#FBE7DD",
        },
        accent: "#FACC15",
      },
      fontFamily: {
        display: ["'Barlow Condensed'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      letterSpacing: {
        widest2: "0.18em",
      },
    },
  },
  plugins: [],
};
