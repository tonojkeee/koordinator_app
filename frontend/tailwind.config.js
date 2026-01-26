/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teams: {
          bg: '#F0F0F0', // Slightly darker gray for better contrast
          sidebar: '#2D2D2D', // Darker, neutral sidebar like new Teams
          sidebarHover: '#3D3D3D',
          accent: '#5B5FC7', // Official MS Teams Blurple
          accentHover: '#4f52b2',
          header: '#FFFFFF',
          border: '#E0E0E0',
          text: {
            primary: '#242424',
            secondary: '#616161',
          }
        },
        primary: {
            50: '#EEF2FF',
            100: '#E0E7FF',
            200: '#C7D2FE',
            300: '#A5B4FC',
            400: '#818CF8',
            500: '#5B5FC7', // Teams Blurple
            600: '#4F46E5',
            700: '#4338CA',
            800: '#3730A3',
            900: '#312E81',
            950: '#1E1B4B',
        }
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'Inter', 'system-ui', 'sans-serif', 'Noto Color Emoji'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'card': '0 2px 4px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
        'elevation': '0 4px 8px rgba(0,0,0,0.08)',
      },
      backdropBlur: {
        'xl': '20px',
      },
      animation: {
        'in': 'fadeIn 0.3s ease-out',
        'slide-in-from-bottom-4': 'slideInFromBottom 0.5s ease-out',
        'zoom-in-95': 'zoomIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInFromBottom: {
          '0%': {
            opacity: '0',
            transform: 'translateY(1rem)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          },
        },
        zoomIn: {
          '0%': {
            opacity: '0',
            transform: 'scale(0.95)'
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)'
          },
        },
      },
    },
  },
  plugins: [],
}
