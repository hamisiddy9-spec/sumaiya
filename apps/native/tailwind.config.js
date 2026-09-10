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
        // Exact values from apps/web/tailwind.config.ts — keep in lockstep.
        espresso: '#211A15',
        espresso_dark: '#171009',
        espresso_line: '#3A2E25',
        // Hyphenated alias some screens use instead of the underscore key.
        'espresso-dark': '#171009',
        ember: '#DA4A1C',
        'ember-tint': '#FBE9E1',
        'ember-hover': '#C13E14',
        'ember-shadow': '#A8330F',
        pine: '#12433D',
        gold: '#F2A93B',
        'gold-text': '#96630F',
        cream: '#FAF5EE',
        sand: '#EFE7DA',
        'sand-2': '#F4EEE4',
        card: '#FFFFFF',
        border: '#E9E0D4',
        'border-input': '#9C8D7B',
        'text-body': '#6B5F54',
        'text-muted': '#756A5E',
        error: '#C13E14',
        success: '#12766A',
        warning: '#96630F',
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
