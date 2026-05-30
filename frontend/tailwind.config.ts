import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Brand tokens TensiMenu
        brand: {
          primary: "#2B7C61",
          "primary-dark": "#1F5E48",
          "primary-light": "#3D9A7C",
          cream: "#FFF7E8",
          "cream-soft": "#FFFCF5",
          charcoal: "#3D3D3D",
          "charcoal-soft": "#5A5A5A",
          "charcoal-muted": "#8A8A8A",
        },
      },
      boxShadow: {
        "glass-sm": "0 2px 12px rgba(43, 124, 97, 0.06)",
        "glass-md": "0 8px 32px rgba(43, 124, 97, 0.08)",
        "glass-lg": "0 16px 48px rgba(43, 124, 97, 0.12)",
        "brand-cta": "0 4px 14px rgba(43, 124, 97, 0.25)",
        "brand-cta-hover": "0 6px 20px rgba(43, 124, 97, 0.35)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-irish-grover)", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
