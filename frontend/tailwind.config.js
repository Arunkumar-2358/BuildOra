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
        mist: "#eef3ef",
        linen: "#faf6ef",
        steel: "#52616b",
        gold: "#d8a43f"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(21, 32, 27, 0.12)",
        glow: "0 24px 80px rgba(184, 107, 69, 0.22)",
        crisp: "0 1px 0 rgba(255,255,255,0.7) inset, 0 20px 55px rgba(21,32,27,0.13)"
      }
    }
  },
  plugins: []
};
