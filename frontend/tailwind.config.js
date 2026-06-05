/* BuildOra theme — Construction Red. */
/**
 * BuildOra design system — "Bold Red on Light".
 *
 * Identity: Construction Red (brand) is the dominant signature color, deep warm-black
 * ink for structure, warm-white canvas for breathing room, and warm orange (spark) as
 * the energetic accent. Semantic tokens resolve from CSS variables (see index.css) so a
 * single utility class adapts across light/dark. Fixed brand scales are available for
 * cases that should not flip with theme (gradients, glows, illustrations).
 */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Sora", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      fontSize: {
        // Fluid display sizes build real hierarchy instead of font-extrabold everywhere.
        display: ["clamp(2.75rem, 6vw, 5rem)", { lineHeight: "1.0", letterSpacing: "-0.035em", fontWeight: "700" }],
        "display-sm": ["clamp(2rem, 4vw, 3.25rem)", { lineHeight: "1.05", letterSpacing: "-0.025em", fontWeight: "700" }],
        eyebrow: ["0.78rem", { lineHeight: "1", letterSpacing: "0.16em", fontWeight: "700" }]
      },
      colors: {
        // ---- Semantic tokens (resolve from CSS vars; adapt to light/dark) ----
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

        // Brand red — DEFAULT flips with theme (brighter on dark); scale is fixed.
        brand: {
          DEFAULT: "rgb(var(--brand) / <alpha-value>)",
          50: "#FFF4F1",
          100: "#FFE4DD",
          200: "#FFC7BA",
          300: "#FF9E89",
          400: "#FB6B4D",
          500: "#ED4426",
          600: "#D62D14",
          700: "#B01F0C",
          800: "#8C1A0B",
          900: "#73190D",
          950: "#450B05"
        },
        // Warm orange spark — energetic highlight.
        spark: {
          DEFAULT: "rgb(var(--spark) / <alpha-value>)",
          300: "#FFC487",
          400: "#FFA64D",
          500: "#FB7A1E",
          600: "#E5640A",
          700: "#BC4F08"
        },
        // Warm neutral ramp (deep-black ink → warm white canvas).
        ink: {
          DEFAULT: "#1A130F",
          50: "#FAF7F5",
          100: "#F4EFEC",
          200: "#E8E0DA",
          300: "#D7CCC4",
          400: "#B3A69D",
          500: "#8A7C73",
          600: "#5E534C",
          700: "#423A35",
          800: "#281F1B",
          900: "#1A130F",
          950: "#110B08"
        },

        // Backward-compatible aliases so legacy classes re-skin automatically.
        primary: "rgb(var(--brand) / <alpha-value>)",
        gold: "rgb(var(--spark) / <alpha-value>)",
        frost: "#FAF7F5",
        background: "#110B08",
        foreground: "#FAF7F5",
        card: "#1A130F"
      },
      boxShadow: {
        xs: "0 1px 2px rgba(26, 19, 15, 0.06)",
        sm: "0 2px 8px rgba(26, 19, 15, 0.06), 0 1px 2px rgba(26, 19, 15, 0.05)",
        md: "0 8px 24px rgba(26, 19, 15, 0.08), 0 2px 6px rgba(26, 19, 15, 0.05)",
        lg: "0 18px 48px rgba(26, 19, 15, 0.12), 0 4px 12px rgba(26, 19, 15, 0.06)",
        xl: "0 32px 80px rgba(26, 19, 15, 0.16), 0 8px 24px rgba(26, 19, 15, 0.08)",
        soft: "0 18px 60px rgba(26, 19, 15, 0.12)",
        glow: "0 14px 40px -8px rgba(214, 45, 20, 0.45)",
        "glow-sm": "0 8px 22px -6px rgba(214, 45, 20, 0.4)",
        crisp: "inset 0 1px 0 rgba(255,255,255,0.6), 0 16px 32px rgba(26, 19, 15, 0.12)",
        "crisp-dark": "inset 0 1px 0 rgba(255,255,255,0.06), 0 18px 50px rgba(0, 0, 0, 0.5)"
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #ED4426 0%, #D62D14 55%, #B01F0C 100%)",
        "brand-spark": "linear-gradient(120deg, #D62D14 0%, #FB7A1E 100%)",
        "ink-gradient": "linear-gradient(160deg, #1A130F 0%, #281F1B 100%)",
        "mesh-radial":
          "radial-gradient(circle at 12% 18%, rgba(214,45,20,0.16), transparent 46%), radial-gradient(circle at 86% 4%, rgba(251,122,30,0.14), transparent 42%), radial-gradient(circle at 72% 82%, rgba(214,45,20,0.10), transparent 44%)",
        "blueprint":
          "linear-gradient(rgba(26,19,15,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(26,19,15,0.04) 1px, transparent 1px)"
      },
      backgroundSize: {
        grid: "44px 44px"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" }
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-16px)" }
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" }
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" }
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" }
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(214,45,20,0.5)" },
          "70%": { boxShadow: "0 0 0 14px rgba(214,45,20,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(214,45,20,0)" }
        },
        "bg-pan": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" }
        }
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-slow": "float-slow 9s ease-in-out infinite",
        shimmer: "shimmer 1.6s infinite",
        marquee: "marquee 30s linear infinite",
        "spin-slow": "spin-slow 18s linear infinite",
        "pulse-ring": "pulse-ring 2.2s ease-out infinite",
        "bg-pan": "bg-pan 8s ease infinite"
      },
      borderRadius: {
        sm: "0.5rem",
        DEFAULT: "0.625rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "2rem"
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.22, 1, 0.36, 1)",
        "premium-in": "cubic-bezier(0.64, 0, 0.78, 0)"
      }
    }
  },
  plugins: []
};
