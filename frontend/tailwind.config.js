/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}"
  ],
  theme: {
    extend: {
      colors: {
        // Carbon/graphite neutrals — true neutral, no blue cast
        surface: {
          950: '#0a0a0a',
          900: '#131313',
          800: '#1d1c1c',
          700: '#2b2a2a',
          600: '#3a3838',
          500: '#4d4a4a',
        },
        // Racing red — primary brand color, matches the shield logo
        brand: {
          300: '#fca5a1',
          400: '#f4685f',
          500: '#e5231b',
          600: '#c81a13',
          700: '#a4140f',
          800: '#7f100c',
          900: '#5c0b09',
        },
        // Pit-lane gold — secondary accent, matches the dial's yellow sweep
        gold: {
          300: '#fde68a',
          400: '#fbbf24',
          500: '#f2a91c',
          600: '#d97706',
          700: '#b45309',
        },
        success: {
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
        },
        // Rose — kept a step away from brand red so error states stay legible
        danger: {
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-brand': '0 0 24px rgba(229, 35, 27, 0.25)',
        'glow-gold': '0 0 24px rgba(242, 169, 28, 0.25)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-14px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
      },
    },
  },
  plugins: [],
};
