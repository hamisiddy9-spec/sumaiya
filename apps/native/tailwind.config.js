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
        espresso: '#1a1410',
        espresso_dark: '#0f0a07',
        espresso_line: '#3d2f27',
        // Hyphenated alias some screens use instead of the underscore key.
        'espresso-dark': '#0f0a07',
        ember: '#d85c2c',
        'ember-tint': '#f2e8e3',
        'ember-hover': '#c24a1f',
        gold: '#f2a93b',
        cream: '#fef5f0',
        sand: '#f5ede6',
        card: '#faf8f6',
        border: '#e8ddd4',
        'text-body': '#4a4540',
        'text-muted': '#8b7d75',
        error: '#ef4444',
        success: '#22c55e',
        warning: '#f59e0b',
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
