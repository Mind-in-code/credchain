/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        cream: {
          DEFAULT: '#F4F0E8',
          50: '#FBF9F5',
          100: '#F4F0E8',
          200: '#EBE5D9',
          300: '#DED6C4',
          400: '#C9BEA5',
        },
        navy: {
          DEFAULT: '#0B1C2E',
          700: '#152B42',
          800: '#0F2336',
          900: '#0B1C2E',
          950: '#071523',
        },
        gold: {
          DEFAULT: '#B8962E',
          50: '#FAF6E9',
          100: '#F2EAC9',
          300: '#D9C271',
          500: '#B8962E',
          600: '#9A7C22',
          700: '#7C6119',
        },
        verified: {
          DEFAULT: '#1F7A4D',
          50: '#EDF6F1',
          100: '#D8ECE1',
          500: '#1F7A4D',
          600: '#186139',
        },
        revoked: {
          DEFAULT: '#A32E2E',
          50: '#FAEDED',
          100: '#F2D8D8',
          500: '#A32E2E',
          600: '#832525',
        },
        ink: {
          DEFAULT: '#1B2530',
          soft: '#4A5561',
          muted: '#77818C',
        },
        line: {
          DEFAULT: '#E0DACD',
          strong: '#CFC7B6',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(11, 28, 46, 0.04)',
        lift: '0 2px 6px rgba(11, 28, 46, 0.06), 0 18px 40px rgba(11, 28, 46, 0.08)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.35s ease-out both',
        'scale-in': 'scale-in 0.18s ease-out both',
      },
    },
  },
  plugins: [],
}
