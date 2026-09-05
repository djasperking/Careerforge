import type { Config } from "tailwindcss";

/**
 * Career Forge design system tokens.
 * Colors are exposed as CSS variables in src/app/globals.css so that
 * admin-configurable theming can override them later without a rebuild.
 */
const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--cf-border))",
        input: "hsl(var(--cf-input))",
        ring: "hsl(var(--cf-ring))",
        background: "hsl(var(--cf-background))",
        foreground: "hsl(var(--cf-foreground))",
        primary: {
          DEFAULT: "hsl(var(--cf-primary))",
          foreground: "hsl(var(--cf-primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--cf-secondary))",
          foreground: "hsl(var(--cf-secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--cf-muted))",
          foreground: "hsl(var(--cf-muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--cf-accent))",
          foreground: "hsl(var(--cf-accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--cf-destructive))",
          foreground: "hsl(var(--cf-destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--cf-success))",
          foreground: "hsl(var(--cf-success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--cf-warning))",
          foreground: "hsl(var(--cf-warning-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--cf-card))",
          foreground: "hsl(var(--cf-card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--cf-radius)",
        md: "calc(var(--cf-radius) - 2px)",
        sm: "calc(var(--cf-radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
