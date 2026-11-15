/** Valmart design tokens live in src/index.css (:root). Tailwind only maps names to them. */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // rgb channels let Tailwind apply opacity modifiers such as bg-ink-950/75
      colors: {
        ink: {
          950: 'rgb(var(--ink-950-rgb) / <alpha-value>)', 900: 'rgb(var(--ink-900-rgb) / <alpha-value>)',
          800: 'rgb(var(--ink-800-rgb) / <alpha-value>)', 700: 'rgb(var(--ink-700-rgb) / <alpha-value>)',
        },
        line: 'rgb(var(--line-rgb) / <alpha-value>)',
        sky: { DEFAULT: 'rgb(var(--sky-rgb) / <alpha-value>)', soft: 'rgb(var(--sky-soft-rgb) / <alpha-value>)', deep: 'var(--sky-deep)' },
        sun: { DEFAULT: 'rgb(var(--sun-rgb) / <alpha-value>)', soft: 'rgb(var(--sun-soft-rgb) / <alpha-value>)' },
        fg: { DEFAULT: 'rgb(var(--fg-rgb) / <alpha-value>)', muted: 'rgb(var(--fg-muted-rgb) / <alpha-value>)' },
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
      borderRadius: { card: '10px', pill: '8px' },
    },
  },
  plugins: [],
}
