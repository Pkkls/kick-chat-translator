import type { Config } from 'tailwindcss';

/** One token from src/shared/theme.css, kept usable with Tailwind's `/opacity`. */
const token = (name: string) => `rgb(var(--kt-${name}-rgb) / <alpha-value>)`;

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
    // The two radii come from the token file too, so the direction is stated
    // in one place for all three surfaces rather than twice.
    borderRadius: {
      none: '0',
      sm: 'var(--kt-r-sm)',
      DEFAULT: 'var(--kt-r-sm)',
      md: 'var(--kt-r-sm)',
      lg: 'var(--kt-r-md)',
      xl: 'var(--kt-r-md)',
      '2xl': 'var(--kt-r-md)',
      '3xl': 'var(--kt-r-md)',
      // A pill or a knob: a shape, not a step on the scale.
      full: '9999px',
    },
    extend: {
      // Nothing is decided here any more. Every value points at
      // src/shared/theme.css, which is also what the injected chat stylesheet
      // reads, so the popup, the options page and the chat UI cannot drift
      // apart the way they had: this file used to hold a fourth palette whose
      // page was #0a0e12 and whose card was #13181f, neither of which is the
      // ink and surface the art direction names.
      //
      // Channel triples rather than hex, so the opacity modifiers keep working:
      // `bg-kick-primary/10` compiles to `rgb(var(--kt-green-rgb) / 0.1)`.
      colors: {
        kick: {
          primary: token('green'),
          dark: token('ink'),
          surface: token('surface'),
          border: token('divider'),
          // Kick's own secondary grey. The previous #6b7888 failed AA on every
          // ground it was rendered on — 4.30 on the page, 3.96 on a card, 3.18
          // on an active green card — which is most of the secondary text in
          // the options page and the popup. This measures 7.99 on the page and
          // 7.10 on a card, and it is the value Kick uses.
          muted: token('muted'),
          text: token('text'),
          // The boundary of an interactive control, which WCAG 1.4.11 holds to
          // 3:1 — `border` is 1.21 and is fine for a card's edge but invisible
          // on a checkbox. Measured 3.75 on the page, 3.33 on a card.
          stroke: token('edge'),
          // The same boundary under the pointer or held down.
          'stroke-strong': token('edge-strong'),
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
