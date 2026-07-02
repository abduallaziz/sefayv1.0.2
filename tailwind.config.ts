import type { Config } from 'tailwindcss'

const config: Config = {
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
      /* ── Colors ── */
      colors: {
        brand: {
          DEFAULT: '#0C447C',
          dark:    '#082F5C',
          2:       '#1565C0',
          3:       '#2671C4',
          light:   '#E8F0FB',
        },
        surface: {
          bg:     'var(--surface-bg)',
          card:   'var(--surface-card)',
          border: 'var(--surface-border)',
          hover:  'var(--surface-hover)',
          muted:  'var(--surface-muted)',
        },
        content: {
          primary:   'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted:     'var(--text-muted)',
          inverse:   'var(--text-inverse)',
          brand:     'var(--text-brand)',
        },
        semantic: {
          success:        'var(--success)',
          'success-bg':   'var(--success-bg)',
          warning:        'var(--warning)',
          'warning-bg':   'var(--warning-bg)',
          error:          'var(--error)',
          'error-bg':     'var(--error-bg)',
          info:           'var(--info)',
          'info-bg':      'var(--info-bg)',
        },
        chart: {
          1: 'var(--chart-1)',
          2: 'var(--chart-2)',
          3: 'var(--chart-3)',
          4: 'var(--chart-4)',
          5: 'var(--chart-5)',
          6: 'var(--chart-6)',
        },
      },

      /* ── Border Radius ── */
      borderRadius: {
        xs:   '11px',
        sm:   '14px',
        DEFAULT: '14px',
        md:   '20px',
        lg:   '24px',
        xl:   '32px',
        full: '9999px',
      },

      /* ── Box Shadow ── */
      boxShadow: {
        xs:    '0 1px 2px rgba(15,23,42,0.04)',
        sm:    '0 2px 8px rgba(15,23,42,0.06)',
        DEFAULT: '0 4px 16px rgba(15,23,42,0.08)',
        md:    '0 4px 16px rgba(15,23,42,0.08)',
        lg:    '0 8px 32px rgba(15,23,42,0.10)',
        xl:    '0 16px 48px rgba(15,23,42,0.12)',
        brand: '0 4px 20px rgba(12,68,124,0.25)',
        glass: '0 8px 32px rgba(12,68,124,0.10)',
      },

      /* ── Background Image ── */
      backgroundImage: {
        'gradient-brand':   'linear-gradient(135deg, #082F5C 0%, #0C447C 50%, #1761B8 100%)',
        'gradient-brand-r': 'linear-gradient(135deg, #1761B8 0%, #0C447C 50%, #082F5C 100%)',
        'gradient-card':    'linear-gradient(135deg, rgba(12,68,124,0.04) 0%, rgba(38,113,196,0.04) 100%)',
        'gradient-hero':    'linear-gradient(160deg, #082F5C 0%, #0C447C 40%, #1565C0 80%, #2671C4 100%)',
      },

      /* ── Font Family ── */
      fontFamily: {
        sans: ['Inter', 'IBM Plex Sans Arabic', 'system-ui', 'sans-serif'],
        arabic: ['IBM Plex Sans Arabic', 'Inter', 'system-ui', 'sans-serif'],
      },

      /* ── Font Size ── */
      fontSize: {
        '2xs': ['11px', { lineHeight: '16px' }],
        xs:    ['12px', { lineHeight: '18px' }],
        sm:    ['13px', { lineHeight: '20px' }],
        base:  ['14px', { lineHeight: '22px' }],
        md:    ['15px', { lineHeight: '24px' }],
        lg:    ['16px', { lineHeight: '24px' }],
        xl:    ['18px', { lineHeight: '28px' }],
        '2xl': ['20px', { lineHeight: '30px' }],
        '3xl': ['24px', { lineHeight: '32px' }],
        '4xl': ['28px', { lineHeight: '36px' }],
        '5xl': ['32px', { lineHeight: '40px' }],
        '6xl': ['40px', { lineHeight: '48px' }],
      },

      /* ── Spacing ── */
      spacing: {
        sidebar: '256px',
        header:  '64px',
        18:      '72px',
        22:      '88px',
      },

      /* ── Animation ── */
      animation: {
        'fade-up':     'fadeUp 0.4s ease both',
        'scale-in':    'scaleIn 0.2s ease both',
        'slide-right': 'slideInRight 0.3s ease both',
        'slide-left':  'slideInLeft 0.3s ease both',
        'shimmer':     'shimmer 1.5s ease-in-out infinite',
        'glow-pulse':  'glow-pulse 2s ease-in-out infinite',
      },

      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-16px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(12,68,124,0)' },
          '50%':      { boxShadow: '0 0 0 8px rgba(12,68,124,0.08)' },
        },
      },

      /* ── Transition Duration ── */
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
        slow: '300ms',
      },

      /* ── Max Width ── */
      maxWidth: {
        content: '1280px',
      },

      /* ── Z-Index ── */
      zIndex: {
        sidebar:  '40',
        header:   '50',
        modal:    '60',
        toast:    '70',
        tooltip:  '80',
      },
    },
  },
  plugins: [],
}

export default config