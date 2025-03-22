/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        animation: {
          'fadeIn': 'fadeIn 0.3s ease-out forwards',
          'success': 'successPulse 0.6s ease-in-out',
        },
        keyframes: {
          fadeIn: {
            '0%': { opacity: '0', transform: 'translateY(10px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' },
          },
          successPulse: {
            '0%': { transform: 'scale(1)', backgroundColor: 'rgb(79, 70, 229)' },
            '50%': { transform: 'scale(1.05)', backgroundColor: 'rgb(16, 185, 129)' },
            '100%': { transform: 'scale(1)', backgroundColor: 'rgb(79, 70, 229)' },
          },
        },
      },
    },
    plugins: [],
  }