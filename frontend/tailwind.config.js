/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          cream: "#FEF3E2",
          shell: "#E2CBB0",
          line: "#CEB394",
          dark: "#2A1A0E",
          muted: "#6A5B4E",
          // Terracotta accent — used as focus ring, active state, primary CTA.
          // Darker steps so white text clears 4.5:1 contrast.
          orange: "#B85114",
          "orange-strong": "#9C4410",
          amber: "#F4AE52",
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      opacity: {
        8: "0.08",
        12: "0.12",
        15: "0.15",
        35: "0.35",
        55: "0.55",
      },
    },
  },
  plugins: [],
};
