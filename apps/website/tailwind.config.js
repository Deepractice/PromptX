/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx,ts,tsx,md,mdx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './theme.config.tsx',
  ],
  theme: {
    extend: {
      colors: {
        // Cold colors (rational/compute) - Deep Blue
        rational: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        // Primary blue (Monogent style)
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#2C3E50', // Main dark blue
          600: '#273442',
          700: '#1f2937',
          800: '#1a202c',
          900: '#151a23',
        },
        // Warm colors (creative/generate) - Amber Gold
        creative: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#F39C12', // Main amber
          600: '#E67E22', // Deeper orange-gold
          700: '#d97706',
          800: '#b45309',
          900: '#92400e',
        },
        // Background grays - subtle variations for sections
        background: {
          lightest: '#F5F7F9',
          light: '#ECF0F1',
          DEFAULT: '#E8EEF2',
          dark: '#DFE4E8',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-cold-warm': 'linear-gradient(135deg, #0c4a6e 0%, #7c2d12 100%)',
        'gradient-warm-purple': 'linear-gradient(135deg, #f97316 0%, #a855f7 100%)',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
