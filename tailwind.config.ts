import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        // Titulares: Montserrat
        display: ["var(--font-display)", ...fontFamily.sans],
        heading: ["var(--font-display)", ...fontFamily.sans],
        // Cuerpo: Lato
        body: ["var(--font-body)", ...fontFamily.sans],
        sans: ["var(--font-body)", ...fontFamily.sans],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // ── Te Quiero — paleta directa del manual ───────────────
        tq: {
          sky:    "#0099F2",  // Pantone 2193 C  — primario vibrante
          ink:    "#00557F",  // Pantone 19-4049 — Snorkel Blue, titulares
          deep:   "#003B58",  // tono extra para sidebar profundo
          cream:  "#E8E3DF",  // Pantone 11-1001 — White Alyssum, fondo
          paper:  "#F4F1ED",  // crema más claro, layering
          gold:   "#C8A164",  // Pantone 7562 C  — acento joya (decorativo)
          gold2:  "#8B6A35",  // dorado oscuro accesible para texto (AA sobre crema)
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "tq-soft":   "0 1px 2px rgba(0,68,107,0.04), 0 4px 14px rgba(0,68,107,0.06)",
        "tq-card":   "0 1px 0 rgba(0,68,107,0.04), 0 12px 32px -16px rgba(0,68,107,0.18)",
        "tq-float":  "0 24px 60px -20px rgba(0,68,107,0.35)",
        "tq-gold":   "0 6px 20px -8px rgba(200,161,100,0.55)",
      },
      backgroundImage: {
        "tq-grain":
          "radial-gradient(rgba(0,68,107,0.045) 1px, transparent 1px)",
        "tq-mesh":
          "radial-gradient(at 20% 10%, rgba(0,153,242,0.25) 0px, transparent 55%), radial-gradient(at 85% 90%, rgba(0,85,127,0.55) 0px, transparent 50%), radial-gradient(at 60% 30%, rgba(200,161,100,0.18) 0px, transparent 45%)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "tq-shimmer": {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "tq-float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "tq-shimmer":     "tq-shimmer 3s linear infinite",
        "tq-float":       "tq-float 5s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
