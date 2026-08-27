import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/popup/**/*.{ts,tsx,html}',
    './src/options/**/*.{ts,tsx,html}',
  ],
  darkMode: 'class',
  theme: {
    // Kick's art direction has two radii, 4 and 8, measured on about.kick.com.
    // Tailwind's own scale has nine, and the one the codebase reaches for most,
    // `rounded-md`, is 0.375rem: 460 elements across the popup and the six
    // option tabs were drawing a 6px corner that the direction does not have.
    // Redefined here rather than corrected at 460 call sites.
    borderRadius: {
      none: '0',
      sm: '4px',
      DEFAULT: '4px',
      md: '4px',
      lg: '8px',
      xl: '8px',
      '2xl': '8px',
      '3xl': '8px',
      // A pill or a knob: a shape, not a step on the scale.
      full: '9999px',
    },
    extend: {
      colors: {
        kick: {
          primary: '#53fc18',
          dark: '#0a0e12',
          surface: '#13181f',
          border: '#1f2731',
          // Kick's own secondary grey. The previous #6b7888 failed AA on every
          // ground it was rendered on — 4.30 on the page, 3.96 on a card, 3.18
          // on an active green card — which is most of the secondary text in
          // the options page and the popup. This measures 7.87 / 7.24 / 7.52 /
          // 5.82 on those same four grounds, and it is the value Kick uses.
          muted: '#9fa6ad',
          text: '#e8eef7',
          // The boundary of an interactive control, which WCAG 1.4.11 holds to
          // 3:1 — `border` is 1.18 to 1.28 and is fine for a card's edge but
          // invisible on a checkbox. Measured: 3.34 on the page, 3.07 on a
          // card, 3.19 on a translucent card.
          stroke: '#60666d',
          // The same boundary under the pointer or held down.
          'stroke-strong': '#8a9099',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(83,252,24,0.15), 0 4px 24px -8px rgba(83,252,24,0.3)',
      },
    },
  },
  plugins: [],
} satisfies Config;
