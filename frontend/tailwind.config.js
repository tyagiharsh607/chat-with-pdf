// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"], // make sure this matches your project
  theme: {
    extend: {
      colors: {
        primary: "#0B132B",
        secondary: "#1C2541",
        accent: "#4FC3F7",
        muted: "#B0BEC5",
        glass: "rgba(255, 255, 255, 0.05)",
        "glass-border": "rgba(255, 255, 255, 0.1)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
      backdropBlur: {
        md: "10px",
      },
    },
  },
  plugins: [],
};
