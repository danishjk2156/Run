/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        aura: {
          base: "#f8fafc",
          awakened: "#00bfff",
          kaioken: "#ff4500",
          syana: "#ffd700",
          syana2: "#7b68ee",
          god: "#ff1493",
        },
      },
      animation: {
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "aura-glow": "auraGlow 3s ease-in-out infinite alternate",
        "lightning": "lightning 0.4s ease-in-out infinite",
      },
      keyframes: {
        auraGlow: {
          "0%": { boxShadow: "0 0 20px rgba(255, 215, 0, 0.3)" },
          "100%": { boxShadow: "0 0 50px rgba(255, 215, 0, 0.8), 0 0 80px rgba(255, 69, 0, 0.4)" },
        },
        lightning: {
          "0%, 100%": { opacity: "0.2" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
