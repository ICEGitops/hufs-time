/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js}'
  ],
  theme: {
    extend: {
      colors: {
        hufs: {
          navy: '#002843',
          dark: '#001a2e',
          blue: '#0a5e8a',
          sky: '#1a8bc5',
          light: '#e8f4fa',
          pale: '#f0f7fb'
        }
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,40,67,0.08), 0 1px 2px rgba(0,40,67,0.06)',
        'card-hover': '0 4px 12px rgba(0,40,67,0.12), 0 2px 4px rgba(0,40,67,0.08)',
        panel: '0 2px 8px rgba(0,40,67,0.06)'
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.7' }
        }
      }
    }
  },
  plugins: []
}
