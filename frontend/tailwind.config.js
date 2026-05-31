export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        // Semantic theme tokens — resolve from CSS variables so the same
        // utility class adapts to light/dark automatically.
        base: "rgb(var(--bg) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          2: "rgb(var(--surface-2) / <alpha-value>)",
          deep: "rgb(var(--surface-deep) / <alpha-value>)"
        },
        content: "rgb(var(--content) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        subtle: "rgb(var(--subtle) / <alpha-value>)",
        line: {
          DEFAULT: "rgb(var(--line) / <alpha-value>)",
          strong: "rgb(var(--line-strong) / <alpha-value>)"
        },
        accent: "rgb(var(--accent) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",

        // Fixed brand colors (read well on both themes).
        background: "#070B14",
        foreground: "#F8FAFC",
        card: "#0F172A",
        primary: "#2563EB",
        indigo: "#4F46E5",
        emerald: "#10B981",
        gold: "#FBBF24",
        ink: "#0B1220",
        frost: "#F8FAFC"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(2, 8, 23, 0.24)",
        glow: "0 14px 45px rgba(37, 99, 235, 0.35)",
        crisp: "0 1px 0 rgba(255,255,255,0.08) inset, 0 16px 32px rgba(2, 8, 23, 0.3)"
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #2563EB 0%, #4F46E5 55%, #10B981 100%)",
        "mesh-radial":
          "radial-gradient(circle at 15% 20%, rgba(37,99,235,0.35), transparent 45%), radial-gradient(circle at 80% 0%, rgba(79,70,229,0.3), transparent 40%), radial-gradient(circle at 70% 80%, rgba(16,185,129,0.25), transparent 40%)"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" }
        }
      },
      animation: {
        float: "float 5s ease-in-out infinite"
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem"
      }
    }
  },
  plugins: []
};
