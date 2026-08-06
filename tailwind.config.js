/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/shared/**/*.{js,ts,jsx,tsx,mdx}',
    './src/core/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          bg: '#0f1117',
          sidebar: '#141720',
          border: '#1e2130',
          card: '#1a1f2e',
          hover: '#242938',
        },
        brand: {
          DEFAULT: '#6366f1',
          hover: '#4f46e5',
          light: '#818cf8',
        },
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        muted: '#64748b',

        // --- Matrix A1: staged pos-cloud design tokens ---
        // Additive only. Nothing above this block was changed or reordered.
        // Namespaced under `posCloud` so nothing here can collide with the
        // existing brand/navy/success/warning/danger/muted tokens (some of
        // which share a name but a different hex value, e.g. success/danger).
        // Not consumed by any component yet — introduced for future
        // component-restyle Matrix items only. See Migration Log A1 and the
        // stat-card.tsx defect entry for context.
        posCloud: {
          primary: {
            DEFAULT: '#2563eb',
            dark: '#1e40af',
            light: '#dbeafe',
            400: '#60a5fa',
          },
          success: {
            DEFAULT: '#16a34a',
            light: '#dcfce7',
          },
          warning: {
            DEFAULT: '#f59e0b',
            light: '#fef3c7',
          },
          danger: {
            DEFAULT: '#ef4444',
            light: '#fee2e2',
          },
          info: {
            DEFAULT: '#7c3aed',
            light: '#ede9fe',
          },
          text: {
            primary: '#0f172a',
            secondary: '#334155',
            tertiary: '#64748b',
          },
          border: '#e2e8f0',
          surface: '#ffffff',
          background: '#ffffff',
          sidebar: '#f8fafc',
          navy: {
            950: '#0b1220',
            900: '#0f1b33',
            800: '#16234a',
          },
        },

        // --- Matrix A3: pos-cloud dark-mode counterparts ---
        // Additive only, same rules as the posCloud block above. A uses
        // Tailwind's `dark:` class-variant strategy (darkMode: 'class',
        // driven by theme.store.ts toggling document.documentElement),
        // not CSS-custom-property swapping — so dark values are staged
        // here as their own token set (e.g. `dark:bg-posCloudDark-surface`)
        // rather than as a globals.css `.dark { --var }` block, which
        // would introduce a theming mechanism this project doesn't use.
        // Only the values that actually differ between pos-cloud's light
        // and dark modes are included; primary/success/warning/danger/
        // info/navy are identical in both and already covered above.
        posCloudDark: {
          text: {
            primary: '#f8fafc',
            secondary: '#cbd5e1',
            tertiary: '#94a3b8',
          },
          border: '#263352',
          surface: '#0f1b33',
          background: '#0b1220',
          sidebar: '#0d1830',
        },
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}