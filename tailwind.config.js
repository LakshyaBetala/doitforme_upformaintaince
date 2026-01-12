/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      /* -----------------------------------------
         FONTS
      ----------------------------------------- */
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },

      /* -----------------------------------------
         SWISS MINIMALIST PALETTE
      ----------------------------------------- */
      colors: {
        // Core Theme Colors (Mapped to globals.css variables)
        background: "var(--background)",
        foreground: "var(--foreground)",

        // UI Components
        card: {
          DEFAULT: "var(--card)",
          border: "var(--card-border)",
        },

        // Brand Accents
        brand: {
          purple: "var(--brand-purple)", // #8825F5
          blue: "var(--brand-blue)",   // #0097FF
          pink: "#D31CE7",             // Kept for legacy support
          dark: "#0B0B11",
          darker: "#06060A",
          glass: "rgba(255,255,255,0.05)",
        },
      },

      /* -----------------------------------------
         ANIMATIONS (PRESERVED & REFINED)
      ----------------------------------------- */
      animation: {
        blob: "blob 10s infinite",
        float: "float 6s ease-in-out infinite",
        marquee: "marquee 30s linear infinite", // Adjusted speed for elegance
      },

      keyframes: {
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
        float: {
          "0%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" }, // Reduced movement for minimalism
          "100%": { transform: "translateY(0)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },

      /* -----------------------------------------
         BOX SHADOWS
      ----------------------------------------- */
      boxShadow: {
        neon: "0 0 10px rgba(136,37,245, 0.5), 0 0 20px rgba(0,151,255, 0.3)",
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", // New minimalist shadow
      },
    },
  },
  plugins: [],
};