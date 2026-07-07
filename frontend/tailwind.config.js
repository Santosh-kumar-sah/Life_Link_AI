/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#0b0f19",
          card: "#131c2e",
          accent: "#7c3aed", // violet-600
          glow: "#3b82f6",   // blue-500
          success: "#10b981", // emerald-500
          danger: "#ef4444"   // red-500
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      boxShadow: {
        'glow': '0 0 15px rgba(59, 130, 246, 0.5)',
        'glow-purple': '0 0 15px rgba(124, 58, 237, 0.5)',
      }
    },
  },
  plugins: [],
}
