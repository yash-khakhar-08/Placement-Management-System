/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f172a',    // slate-900 for premium dark mode
        surface: '#1e293b',       // slate-800 for cards/panels
        primary: '#3b82f6',       // blue-500
        primaryHover: '#2563eb',  // blue-600
        secondary: '#8b5cf6',     // violet-500
        accent: '#facc15',        // yellow-400
        textMain: '#f8fafc',      // slate-50
        textMuted: '#94a3b8',     // slate-400
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
