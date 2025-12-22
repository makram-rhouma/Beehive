/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './js/**/*.{js,ts}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#050608',
          900: '#070B12',
          800: '#0C1423'
        },
        brand: {
          50: '#FBF6E6',
          100: '#F4E6BA',
          200: '#EAD58D',
          300: '#E0C35F',
          400: '#D9AC35',
          500: '#D9AC35',
          600: '#B88D26',
          700: '#8E6C1D',
          800: '#614A14',
          900: '#35280B'
        }
      },
      boxShadow: {
        soft: '0 12px 32px rgba(0, 0, 0, 0.18)'
      }
    }
  },
  plugins: []
};
