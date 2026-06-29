import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: "#7C3AED",
          blue: "#2563EB",
          green: "#16A34A",
        },
      },
    },
  },
  plugins: [],
};

export default config;
