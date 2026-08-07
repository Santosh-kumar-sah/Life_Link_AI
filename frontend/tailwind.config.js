/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#FBFAF7",
        "paper-alt": "#F3EFE6",
        sand: "#E8E2D4",
        ink: "#12231F",
        "ink-muted": "#4A5C55",
        primary: {
          DEFAULT: "#1F6F5C",
          dark: "#154C3F",
        },
        critical: "#C4453D",
        signal: "#3C8B6E",
        border: "#DAD3C2",
      },
      fontFamily: {
        serif: ["Fraunces", "Source Serif 4", "Georgia", "serif"],
        sans: ["Inter", "General Sans", "sans-serif"],
        mono: ["IBM Plex Mono", "JetBrains Mono", "monospace"],
      },
      boxShadow: {
        'flat': '0 4px 16px rgba(18, 35, 31, 0.06)',
        'elevated': '0 20px 40px rgba(18, 35, 31, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
      }
    },
  },
  plugins: [],
}
