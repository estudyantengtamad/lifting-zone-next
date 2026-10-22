import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        card: 'var(--color-card)',
        elev: 'var(--color-elev)',
        line: 'var(--color-line)',
        text: 'var(--color-text)',
        'text-muted': 'var(--color-text-muted)',
        'text-subtle': 'var(--color-text-subtle)',
        brand: {
          400: 'var(--color-brand-400)',
          500: 'var(--color-brand-500)',
          700: 'var(--color-brand-700)'
        },
        solare: {
          golden: '#FFAF37',
          beige: '#ECE4D5',
          beigeLight: '#F3EBDA',
          espresso: '#563E3B',
          charcoal: '#414648'
        }
      },
      fontFamily: {
        head: ['var(--font-mont)', 'sans-serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
        solare: ['var(--font-fraunces)', 'serif'],
        serif: ['var(--font-fraunces)', 'serif']
      },
      boxShadow: {
        neon: '0 0 25px var(--color-shadow-neon)',
        golden: '0 0 35px rgba(255,175,55,.45)'
      }
    }
  },
  plugins: []
} satisfies Config
