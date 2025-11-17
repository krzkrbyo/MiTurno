/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#60A5FA',
          foreground: '#1F2937',
        },
        success: {
          DEFAULT: '#10B981',
          foreground: '#FFFFFF',
        },
        background: '#F3F4F6',
        foreground: '#1F2937',
        border: '#E5E7EB',
        input: '#E5E7EB',
        ring: '#2563EB',
        muted: {
          DEFAULT: '#F9FAFB',
          foreground: '#6B7280',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#1F2937',
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#1F2937',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
      boxShadow: {
        soft: '0 2px 8px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
}

