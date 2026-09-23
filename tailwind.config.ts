import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        sans: ['var(--font-sans)', 'sans-serif'],
      },
      colors: {
        paper: 'rgb(var(--paper) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        moss: 'rgb(var(--moss) / <alpha-value>)',
        gold: 'rgb(var(--gold) / <alpha-value>)',
        rust: 'rgb(var(--rust) / <alpha-value>)',
      },
      maxWidth: { prose: '68ch', page: '1120px' },
      keyframes: {
        reveal: { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: { reveal: 'reveal 0.5s ease-out both' },
    },
  },
  plugins: [],
};
export default config;
