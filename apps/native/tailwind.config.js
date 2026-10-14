/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Keep in sync with vendor/design-tokens/src/index.ts (the shared
        // source of truth for web + mobile). This file previously only had
        // half these keys — every `dark:bg-espresso_dark` and
        // `bg-error`/`bg-success`/`bg-warning` class in the app (used across
        // ~20 screens) resolved to an undefined Tailwind color, i.e. no
        // background at all, which is why dark mode never actually darkened
        // and error/success banners rendered with no fill.
        //
        // VALUES: `docs/DESIGN-GUIDE.md` §1 (the guide's warm scale, derived
        // from ember). Stitch's own palette is rejected — its `primary`
        // `#ab2e00` came from a Material tonal algorithm and ember appeared
        // zero times in its eight screens. The legacy keys below (cream, sand,
        // card, espresso) are kept as NAMES for the ~20 screens still using
        // them, but they now resolve to the guide's values, so a screen renders
        // the guide's palette whether or not it has been migrated to the new
        // key names yet. `theme-tokens.test.ts` pins these literals.
        //
        // ⚠️ There is deliberately NO `#ffffff` surface here. The guide: "In a
        // warm palette a white card reads as a hole" — the lightest surface is
        // #FBF9F5, and white is permitted only as on-ember text.
        //
        // ── The guide's names ──────────────────────────────────────────────
        surface: '#FBF9F5',
        'surface-raised': '#F5F3EF',
        'surface-sunken': '#EFEEEA',
        'border-strong': '#8E7068',
        'on-ember': '#FFFFFF', // text/icons ON ember only
        'ember-pressed': '#B93C13',
        'success-tint': 'rgba(24, 106, 34, 0.10)',
        'error-tint': 'rgba(186, 26, 26, 0.10)',
        // ── Legacy names, guide values ─────────────────────────────────────
        espresso: '#211A15',
        espresso_dark: '#1B1C1A',
        espresso_line: 'rgba(226, 191, 181, 0.24)',
        // Hyphenated alias some screens use instead of the underscore key.
        'espresso-dark': '#1B1C1A',
        ember: '#DA4A1C',
        'ember-tint': 'rgba(218, 74, 28, 0.12)',
        'ember-hover': '#C2410C',
        'ember-shadow': '#B93C13',
        cream: '#FBF9F5', // legacy name for `surface`
        sand: '#EFEEEA', // legacy name for `surface-sunken`
        'sand-2': '#F5F3EF', // legacy name for `surface-raised`
        card: '#F5F3EF', // NOT white, per the guide's surface rule
        border: '#E2BFB5',
        'border-input': '#8E7068',
        'text-body': '#1B1C1A',
        'text-muted': '#5A413A',
        error: '#BA1A1A',
        success: '#186A22',
        warning: '#B45309',
        // ── Off-guide legacy accents, kept until their screens are migrated ──
        // The guide's "do not keep both palettes" rule means these should go;
        // they stay only so no screen silently loses a fill in the meantime.
        pine: '#12433D',
        gold: '#F2A93B',
        'gold-text': '#96630F',
      },
      spacing: {
        0.5: '2px',
        1: '4px',
        1.5: '6px',
        2: '8px',
        2.5: '10px',
        3: '12px',
        3.5: '14px',
        4: '16px',
        5: '20px',
        6: '24px',
        7: '28px',
        8: '32px',
        9: '36px',
        10: '40px',
        11: '44px',
        12: '48px',
      },
      borderRadius: {
        'input-sm': '8px',
        'input-lg': '12px',
        'card': '16px',
      },
      // ── §2 TYPOGRAPHY — three families, three jobs ─────────────────────
      //
      // ⚠️ NativeWind keeps only the FIRST entry of each array: the interop's
      // `parseFontFamily` returns `fontFamily[0]`, because React Native takes a
      // single family name and has no font stack. So the name registered with
      // expo-font leads, and the web names after it record the intent without
      // ever reaching RN:
      //
      //   display  Bricolage Grotesque 800 — headings
      //   sans     Hanken Grotesk → Inter  — body / UI
      //   mono     JetBrains Mono          — numerics, tracked eyebrows
      //
      // Those three names are registered (and read back) in
      // `src/app/_layout.tsx`; `components/ui/typography.test.ts` pins the two
      // lists together, so a family renamed on one side cannot quietly fall
      // back to the system font on the other. The bolder cuts of the same
      // families are registered there too — pair a `fontWeight` with the cut
      // that carries it (`HankenGrotesk_700Bold`), never with `sans`.
      fontFamily: {
        display: ['BricolageGrotesque_800ExtraBold', 'Bricolage Grotesque', 'system-ui', 'sans-serif'],
        sans: ['HankenGrotesk_400Regular', 'Hanken Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrainsMono_400Regular', 'JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['14px', { lineHeight: '20px' }],
        base: ['16px', { lineHeight: '24px' }],
        lg: ['18px', { lineHeight: '28px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
        '4xl': ['36px', { lineHeight: '40px' }],
      },
    },
  },
  plugins: [],
};
