/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
  border: '#E5E7EB',
  input: '#FFFFFF',
  ring: '#16A34A',
  background: '#F8FAFC',
  foreground: '#1F2937',
  primary: {
    DEFAULT: '#16A34A',
    foreground: '#FFFFFF',
  },
  secondary: {
    DEFAULT: '#0284C7',
    foreground: '#FFFFFF',
  },
  destructive: {
    DEFAULT: '#DC2626',
    foreground: '#FFFFFF',
  },
  muted: {
    DEFAULT: '#F3F4F6',
    foreground: '#6B7280',
  },
  accent: {
    DEFAULT: '#F97316',
    foreground: '#FFFFFF',
  },
  popover: {
    DEFAULT: '#FFFFFF',
    foreground: '#1F2937',
  },
  card: {
    DEFAULT: '#FFFFFF',
    foreground: '#1F2937',
  },
  // --- Warna tambahan dari instruksi ---
  warning: {
    DEFAULT: '#F97316',
    foreground: '#FFFFFF',
  },
  error: {
    DEFAULT: '#DC2626',
    foreground: '#FFFFFF',
  },
  success: {
    DEFAULT: '#16A34A',
    foreground: '#FFFFFF',
  },
},
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace']
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }]
      },
      borderRadius: {
        'lg': '16px',
        'md': '12px',
        'sm': '8px',
        'xs': '4px'
      },
      boxShadow: {
        'agricultural': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'agricultural-lg': '0 4px 6px rgba(0, 0, 0, 0.1)'
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem'
      },
      minHeight: {
        'touch': '48px'
      },
      animation: {
        'grow': 'grow 2s ease-in-out infinite',
        'pulse-gentle': 'pulse 0.2s ease-out'
      },
      keyframes: {
        grow: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' }
        }
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
        '150': '150',
        '200': '200',
        '300': '300'
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('tailwindcss-animate')
  ],
}