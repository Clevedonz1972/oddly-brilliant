/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Cyberpunk Color System
      colors: {
        // Background Colors
        cyber: {
          dark: '#0a0e27',      // Main background
          surface: '#1a1f3a',   // Elevated surfaces
          elevated: '#252b4a',  // Interactive elements
        },

        // Text Colors
        text: {
          cyber: {
            primary: '#e0e7ff',
            secondary: '#94a3b8',
            muted: '#64748b',
          }
        },

        // Primary: Cyan/Electric Blue
        cyan: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#00d9ff',  // Primary
          600: '#00b8d9',
          700: '#0097b3',
          800: '#00768c',
          900: '#005566',
        },

        // Secondary: Magenta/Hot Pink
        magenta: {
          50: '#fff0f7',
          100: '#ffe0ef',
          200: '#ffc2df',
          300: '#ff94c7',
          400: '#ff66af',
          500: '#ff006e',  // Secondary
          600: '#d9005e',
          700: '#b3004e',
          800: '#8c003e',
          900: '#66002e',
        },

        // Accent: Purple
        purple: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7b2cbf',  // Accent
          800: '#6b21a8',
          900: '#581c87',
        },

        // Status Colors
        success: '#00ff88',
        warning: '#ffb800',
        error: '#ff4757',
        info: '#00d9ff',

        // Borders
        border: {
          DEFAULT: '#2d3555',
          glow: '#00d9ff',
        },
      },

      // Typography
      fontFamily: {
        display: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      // Type Scale (1.250 modular scale)
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.5' }],      // 12px
        sm: ['0.875rem', { lineHeight: '1.5' }],     // 14px
        base: ['1rem', { lineHeight: '1.625' }],     // 16px
        lg: ['1.125rem', { lineHeight: '1.5' }],     // 18px
        xl: ['1.25rem', { lineHeight: '1.4' }],      // 20px
        '2xl': ['1.5rem', { lineHeight: '1.3' }],    // 24px
        '3xl': ['1.875rem', { lineHeight: '1.25' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '1.2' }],   // 36px
        '5xl': ['3rem', { lineHeight: '1.1' }],      // 48px
        '6xl': ['3.75rem', { lineHeight: '1' }],     // 60px
      },

      // Spacing System (4px grid)
      spacing: {
        '0.5': '0.125rem',  // 2px
        '1': '0.25rem',     // 4px
        '2': '0.5rem',      // 8px
        '3': '0.75rem',     // 12px
        '4': '1rem',        // 16px
        '5': '1.25rem',     // 20px
        '6': '1.5rem',      // 24px
        '8': '2rem',        // 32px
        '10': '2.5rem',     // 40px
        '12': '3rem',       // 48px
        '16': '4rem',       // 64px
        '20': '5rem',       // 80px
        '24': '6rem',       // 96px
      },

      // Border Radius
      borderRadius: {
        none: '0',
        sm: '0.125rem',   // 2px
        DEFAULT: '0.25rem', // 4px
        md: '0.5rem',     // 8px
        lg: '0.75rem',    // 12px
        xl: '1rem',       // 16px
        '2xl': '1.5rem',  // 24px
        '3xl': '2rem',    // 32px
        full: '9999px',
      },

      // Cyberpunk Glow Shadow System
      boxShadow: {
        'cyber-sm': '0 0 0 1px rgba(0, 217, 255, 0.2), 0 0 20px rgba(0, 217, 255, 0.05)',
        'cyber-md': '0 0 0 1px #00d9ff, 0 0 25px rgba(0, 217, 255, 0.15)',
        'cyber-lg': '0 0 0 1px #00d9ff, 0 0 30px rgba(0, 217, 255, 0.2)',
        'cyber-xl': '0 0 20px rgba(0, 217, 255, 0.25), 0 0 30px rgba(0, 217, 255, 0.25)',
        'cyber-2xl': '0 0 30px rgba(0, 217, 255, 0.25), 0 0 40px rgba(0, 217, 255, 0.25), 0 0 50px rgba(0, 217, 255, 0.2)',

        // Color variants
        'glow-cyan': '0 0 20px rgba(0, 217, 255, 0.25)',
        'glow-magenta': '0 0 20px rgba(255, 0, 110, 0.25)',
        'glow-purple': '0 0 20px rgba(123, 44, 191, 0.25)',
        'glow-success': '0 0 20px rgba(0, 255, 136, 0.25)',
        'glow-warning': '0 0 20px rgba(255, 184, 0, 0.25)',
        'glow-error': '0 0 20px rgba(255, 71, 87, 0.25)',
      },

      // Animation Timing
      transitionTimingFunction: {
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },

      // Animation Durations
      transitionDuration: {
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
        '700': '700ms',
        '1000': '1000ms',
      },

      // Custom Animations
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 217, 255, 0.25)' },
          '50%': { boxShadow: '0 0 30px rgba(0, 217, 255, 0.25), 0 0 40px rgba(0, 217, 255, 0.25)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'spin': {
          to: { transform: 'rotate(360deg)' },
        },
      },

      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'spin': 'spin 1s linear infinite',
      },

      // Background Images
      backgroundImage: {
        'gradient-cyber': 'linear-gradient(135deg, #00d9ff 0%, #7b2cbf 100%)',
        'gradient-pink': 'linear-gradient(135deg, #ff006e 0%, #ff4757 100%)',
        'gradient-green': 'linear-gradient(135deg, #00ff88 0%, #00d9ff 100%)',
      },

      // Accessibility - Screen reader only class
      screens: {
        'reduce-motion': { 'raw': '(prefers-reduced-motion: reduce)' },
        'high-contrast': { 'raw': '(prefers-contrast: more)' },
        'forced-colors': { 'raw': '(forced-colors: active)' },
      },
    },
  },
  plugins: [
    // High Contrast Mode plugin
    function({ addUtilities }) {
      addUtilities({
        '.sr-only': {
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          borderWidth: '0',
        },
        '.sr-only.focus\\:not-sr-only:focus': {
          position: 'static',
          width: 'auto',
          height: 'auto',
          padding: 'inherit',
          margin: 'inherit',
          overflow: 'visible',
          clip: 'auto',
          whiteSpace: 'normal',
        },
      });
    },
  ],
}
