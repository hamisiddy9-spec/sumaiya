import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    screens: {
      xs: "360px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        // Legacy alias — maps the old blue `brand-*` scale onto Warm Confidence
        // ember, so screens not yet fully migrated render warm instead of the
        // colorless output an undefined color class produces.
        brand: {
          50: "#FBE9E1", 100: "#FBE9E1", 200: "#F6C9B6",
          300: "#EE9E7E", 400: "#E5734A",
          500: "#DA4A1C", 600: "#DA4A1C",
          700: "#C13E14", 800: "#A8330F", 900: "#A8330F", 950: "#7A2409",
        },
        // Warm Confidence by Sumaiya
        ember: {
          DEFAULT: "#DA4A1C",
          shadow: "#A8330F",
          hover: "#C13E14",
          tint: "#FBE9E1",
        },
        pine: {
          DEFAULT: "#12433D",
          tint: "#E4EDEA",
        },
        gold: {
          DEFAULT: "#F2A93B",
          tint: "#FBF3E2",
          // Darkened #B57A18 → #96630F so text on gold-tint/cream hits WCAG AA
          // 4.5:1 (was 3.30:1) while keeping the warm gold identity.
          text: "#96630F",
        },
        espresso: {
          DEFAULT: "#211A15",
          2: "#2C231C",
          line: "#3A2E25",
        },
        cream: {
          DEFAULT: "#FAF5EE",
        },
        sand: {
          DEFAULT: "#EFE7DA",
          2: "#F4EEE4",
        },
        card: "#FFFFFF",
        border: {
          DEFAULT: "#E9E0D4",
          // Darkened #DBD1C2 → #9C8D7B so input boundaries reach WCAG 3:1 on
          // white (was 1.51:1) while staying in the warm sand family.
          input: "#9C8D7B",
        },
        "text-body": "#6B5F54",
        // Darkened #9C9186 → #756A5E so muted text hits WCAG AA 4.5:1 on cream
        // (4.86:1) and sand-2 (4.57:1) while keeping the warm taupe identity.
        "text-muted": "#756A5E",
        purple: {
          tint: "#EDE7F5",
          glow: "#7C3AED",
        },
        magenta: {
          smart: "#E0218A",
        },
      },
      fontFamily: {
        display: ['var(--font-display)', '"Bricolage Grotesque"', "system-ui", "sans-serif"],
        sans: ['var(--font-body)', '"Hanken Grotesk"', "system-ui", "sans-serif"],
        mono: ['var(--font-mono)', '"JetBrains Mono"', "monospace"],
      },
      borderRadius: {
        input: "8px",
        "input-lg": "12px",
        card: "16px",
        "card-lg": "20px",
        pill: "999px",
        device: "18px",
        "device-lg": "20px",
        phone: "40px",
      },
      boxShadow: {
        "ember-hard": "0 3px 0 #A8330F",
        "ember-active": "0 1px 0 #A8330F",
        card: "0 2px 8px rgba(33,26,21,0.05)",
        "card-hover": "0 8px 24px rgba(33,26,21,0.12)",
        floating: "0 12px 30px -12px rgba(33,26,21,0.25)",
        device: "0 30px 70px -30px rgba(33,26,21,0.35)",
        // Focus ring — solid ember (4.22:1 on white, 3.89:1 on cream) so
        // keyboard focus is visible; the old #FBE9E1 tint was 1.08:1 (invisible).
        "focus-ember": "0 0 0 3px #DA4A1C",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
        "pulse-scale": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.08)" },
        },
        "skeleton-shimmer": {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        marquee: "marquee 28s linear infinite",
        "fade-in-up": "fade-in-up 0.65s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in 0.5s ease-out both",
        float: "float 5s ease-in-out infinite",
        shimmer: "shimmer 1.6s ease-in-out infinite",
        "pulse-scale": "pulse-scale 1.4s ease-in-out infinite",
        "skeleton-shimmer": "skeleton-shimmer 1.5s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
