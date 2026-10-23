/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        espresso: {
          DEFAULT: '#2B1D17',
          light: '#3C2921',
          dark: '#1E1410',
        },
        roast: {
          DEFAULT: '#17120F',
          deep: '#0F0B09',
          surface: '#221A15',
          border: '#362820',
        },
        cream: {
          DEFAULT: '#F7F0E5',
          soft: '#FAF5EE',
          dark: '#EBDDCB',
          muted: '#DFCFBA',
        },
        caramel: {
          DEFAULT: '#C58B54',
          light: '#D99F69',
          dark: '#A66E3A',
        },
        sage: {
          DEFAULT: '#879078',
          light: '#A0AA8F',
          dark: '#6E7660',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        cormorant: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'warm-sm': '0 2px 8px -1px rgba(43, 29, 23, 0.08), 0 1px 4px -1px rgba(43, 29, 23, 0.04)',
        'warm-md': '0 8px 24px -4px rgba(43, 29, 23, 0.12), 0 4px 12px -2px rgba(43, 29, 23, 0.06)',
        'warm-lg': '0 16px 36px -6px rgba(43, 29, 23, 0.18), 0 8px 18px -4px rgba(43, 29, 23, 0.1)',
        'glow-caramel': '0 0 25px rgba(197, 139, 84, 0.35)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-10px) rotate(3deg)' },
        },
        steam: {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '0.4' },
          '50%': { transform: 'translateY(-20px) scale(1.15)', opacity: '0.8' },
          '100%': { transform: 'translateY(-40px) scale(1.3)', opacity: '0' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        }
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        steam: 'steam 3s ease-out infinite',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
