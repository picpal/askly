import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        slideIn: 'slideIn 0.3s ease-out',
        bounceCount: 'bounceCount 0.3s ease-in-out',
        slideInRight: 'slideInRight 0.3s ease-out',
        slideOutRight: 'slideOutRight 0.3s ease-in forwards',
      },
    },
  },
  plugins: [],
};

export default config;
