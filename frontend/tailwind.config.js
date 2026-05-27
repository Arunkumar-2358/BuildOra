export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        ink: "#15201b",
        clay: "#b86b45",
        moss: "#3f6f5a",
        mist: "#eef3ef"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(21, 32, 27, 0.12)"
      }
    }
  },
  plugins: []
};
