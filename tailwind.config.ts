import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        /* StudyOS */
        ui:       ['Inter', 'system-ui', 'sans-serif'],
        lora:     ['Lora', 'Georgia', 'serif'],
        jetbrains:['JetBrains Mono', 'monospace'],
        /* Legacy aliases — kept so existing components compile */
        display:  ['Inter', 'system-ui', 'sans-serif'],
        brand:    ['Inter', 'system-ui', 'sans-serif'],
        mono:     ['JetBrains Mono', 'monospace'],
        body:     ['Lora', 'Georgia', 'serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: "hsl(var(--surface))",
        surface2: "hsl(var(--surface2))",
        surface3: "hsl(var(--surface3))",
        "text-primary": "hsl(var(--text))",
        "text-secondary": "hsl(var(--text-secondary))",
        "theme-muted": "hsl(var(--muted))",
        accent: {
          DEFAULT: "hsl(var(--accent))",
          hover: "hsl(var(--accent-hover))",
          soft: "hsl(var(--accent-soft))",
          foreground: "hsl(var(--accent-foreground))",
        },
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        danger: "hsl(var(--danger))",
        "focus-ring": "hsl(var(--focus-color))",
        /* StudyOS semantic tokens */
        "sos-bg":             "#F1EFE8",
        "sos-card":           "#FFFFFF",
        "sos-primary":        "#185FA5",
        "sos-primary-hover":  "#0C447C",
        "sos-primary-tint":   "#E6F1FB",
        "sos-primary-border": "#85B7EB",
        "sos-border":         "#D3D1C7",
        "sos-border-strong":  "#85B7EB",
        "sos-success":        "#1D9E75",
        "sos-success-tint":   "#E1F5EE",
        "sos-success-text":   "#085041",
        "sos-ai":             "#7F77DD",
        "sos-ai-tint":        "#EEEDFE",
        "sos-ai-text":        "#3C3489",
        "sos-warning":        "#BA7517",
        "sos-warning-tint":   "#FAEEDA",
        "sos-warning-text":   "#854F0B",
        "sos-danger":         "#E24B4A",
        "sos-danger-tint":    "#FCEBEB",
        "sos-danger-text":    "#A32D2D",
        /* Legacy — kept for backward compat */
        "brand-teal": "#185FA5",
        "brand-green": "#1D9E75",
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
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        /* StudyOS spec */
        DEFAULT: "8px",
        card:    "12px",
        pill:    "99px",
        /* Legacy aliases */
        lg: "12px",
        md: "8px",
        sm: "6px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
