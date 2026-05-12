/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef8ff",
          100: "#d8efff",
          200: "#b8e2ff",
          300: "#84ceff",
          400: "#49b0ff",
          500: "#1f93ff",
          600: "#0873db",
          700: "#0a5bae",
          800: "#104f8f",
          900: "#144474"
        }
      },
      boxShadow: {
        soft: "0 8px 24px rgba(16, 79, 143, 0.10)"
      }
    }
  },
  plugins: []
};
