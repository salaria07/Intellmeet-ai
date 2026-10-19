/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060913',
          900: '#0a0f24',
          850: '#0f1738',
          800: '#141f4d',
          700: '#1e2e6b',
          600: '#2c4294',
        },
        brand: {
          blue: '#2563eb',
          electric: '#38bdf8',
          indigo: '#6366f1',
          violet: '#8b5cf6',
          gold: '#f59e0b',
          amber: '#fbbf24',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-blue': '0 0 30px -5px rgba(56, 189, 248, 0.25)',
        'glow-indigo': '0 0 35px -5px rgba(99, 102, 241, 0.25)',
        'glow-gold': '0 0 25px -5px rgba(245, 158, 11, 0.2)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'mesh-glow': 'radial-gradient(circle at 50% 0%, rgba(37,99,235,0.18) 0%, transparent 60%), radial-gradient(circle at 100% 100%, rgba(139,92,246,0.12) 0%, transparent 50%)',
      },
      animation: {
        'spin-slow': 'spin 20s linear infinite',
        'pulse-subtle': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}
