import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
        accent: '#6366F1',
        warning: '#F59E0B',
        danger: '#EF4444',
        dark: {
          100: '#374151',
          200: '#1F2937',
          300: '#111827',
          400: '#0F172A',
          500: '#0B1120',
        },
        ecocash: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        ecocashblue: {
          50: '#e6f2ff',
          100: '#b3d9ff',
          200: '#80bfff',
          300: '#4da6ff',
          400: '#1a8cff',
          500: '#007cff',
          600: '#0066d6',
          700: '#004fa6',
          800: '#003980',
          900: '#002a5a',
          950: '#001a3d',
        },
        brand: {
          blue: '#0045a0',
          red: '#dc2626',
          sky: '#007cff',
          light: '#36a1ff',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
