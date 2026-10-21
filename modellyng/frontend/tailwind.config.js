/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Standard System Colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        placeholder: "hsl(var(--placeholder))",

        // Primary Brand (Indigo)
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
          soft: "hsl(var(--primary-soft))",
          "soft-foreground": "hsl(var(--primary-soft-foreground))",
        },

        // Surface / Card / Muted
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },

        // Academic Status Colors
        status: {
          blue: "hsl(var(--status-blue))",
          "blue-soft": "hsl(var(--status-blue-soft))",
          green: "hsl(var(--status-green))",
          "green-soft": "hsl(var(--status-green-soft))",
          orange: "hsl(var(--status-orange))",
          "orange-soft": "hsl(var(--status-orange-soft))",
          red: "hsl(var(--status-red))",
          "red-soft": "hsl(var(--status-red-soft))",
        },

        // Canvas & Research Flow Colors
        canvas: {
          frequent: "hsl(var(--canvas-frequent))",
          rare: "hsl(var(--canvas-rare))",
          neutral: "hsl(var(--canvas-neutral))",
          edge: "hsl(var(--canvas-edge))",
          gap: "hsl(var(--canvas-gap-fire))",
        },
      },

      borderRadius: {
        card: "var(--radius-card)",
        button: "var(--radius-button)",
        modal: "var(--radius-modal)",
        badge: "var(--radius-badge)",
        "badge-sm": "var(--radius-badge-sm)",
      },

      boxShadow: {
        card: "var(--shadow-card)",
        floating: "var(--shadow-floating)",
        "card-hover": "var(--shadow-card-hover)",
      },

      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },

      fontSize: {
        // Modellyng Official Typography Scale (Tabel B)
        "display-sm": ["2.375rem", { lineHeight: "1.15", letterSpacing: "-1.2px", fontWeight: "800" }], // 38px
        "headline-md": ["1.75rem", { lineHeight: "1.2", letterSpacing: "-0.6px", fontWeight: "800" }],   // 28px
        "headline-sm": ["1.375rem", { lineHeight: "1.3", letterSpacing: "-0.2px", fontWeight: "800" }], // 22px
        "title-lg": ["1.125rem", { lineHeight: "1.35", letterSpacing: "0px", fontWeight: "700" }],       // 18px
        "title-md": ["0.938rem", { lineHeight: "1.4", letterSpacing: "0px", fontWeight: "700" }],        // 15px
        "body-lg": ["1.0rem", { lineHeight: "1.5", letterSpacing: "0px", fontWeight: "400" }],           // 16px
        "body-md": ["0.875rem", { lineHeight: "1.45", letterSpacing: "0px", fontWeight: "400" }],        // 14px
        "label-btn": ["0.875rem", { lineHeight: "1.0", letterSpacing: "0px", fontWeight: "600" }],       // 14px
        "caption-muted": ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.2px", fontWeight: "500" }],  // 12px
        "badge-mini": ["0.688rem", { lineHeight: "1.0", letterSpacing: "0.5px", fontWeight: "700" }],    // 11px
      },
    },
  },
  plugins: [],
}
