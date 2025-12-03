import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Brand Colors (Dodger Blue)
        primary: {
          50: '#E3F2FD',
          100: '#BBDEFB',
          200: '#90CAF9',
          300: '#64B5F6',
          400: '#42A5F5',
          500: '#007AFF', // Main brand color
          600: '#0066CC',
          700: '#0056B3',
          800: '#004799',
          900: '#003A75',
        },
        // Accent Colors
        purple: {
          500: '#A855F7',
          600: '#9333EA',
          700: '#7E22CE',
        },
        green: {
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        amber: {
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        red: {
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
        },
        // Gray Scale
        gray: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#EEEEEE',
          300: '#E0E0E0',
          400: '#BDBDBD',
          500: '#9E9E9E',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
        },
        // Legacy support
        background: "var(--color-background-base)",
        foreground: "var(--text-primary)",
      },
      fontFamily: {
        sans: ['Pretendard', 'var(--font-family-base)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-family-mono)', 'monospace'],
      },
      fontSize: {
        // Display sizes
        'display-lg': ['48px', { lineHeight: '1.2', fontWeight: '700' }],
        'display-md': ['40px', { lineHeight: '1.2', fontWeight: '700' }],
        'display-sm': ['36px', { lineHeight: '1.25', fontWeight: '700' }],
        // Heading sizes (keep default Tailwind names)
        'h1': ['32px', { lineHeight: '1.25', fontWeight: '700' }],
        'h2': ['24px', { lineHeight: '1.25', fontWeight: '600' }],
        'h3': ['20px', { lineHeight: '1.3', fontWeight: '600' }],
        'h4': ['18px', { lineHeight: '1.4', fontWeight: '600' }],
      },
      spacing: {
        '18': '72px',
        '22': '88px',
        '26': '104px',
      },
      borderRadius: {
        'bento': '2.5rem', // 40px - Bento card radius
        '4xl': '2rem',     // 32px
        '5xl': '2.5rem',   // 40px (alias for bento)
      },
      boxShadow: {
        // Bento-specific shadows
        'bento': '0 8px 30px rgb(0 0 0 / 0.04)',
        'bento-hover': '0 12px 40px rgb(0 0 0 / 0.08)',
        'bento-active': '0 6px 20px rgb(0 0 0 / 0.06)',
        // Additional shadows
        'soft': '0 2px 8px rgb(0 0 0 / 0.06)',
        'medium': '0 4px 16px rgb(0 0 0 / 0.1)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
