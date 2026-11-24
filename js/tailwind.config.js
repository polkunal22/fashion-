/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['../html/**/*.html', './**/*.js', './html/**/*.html', './js/**/*.js'],
  corePlugins: {
    preflight: false
  },
  theme: {
    extend: {
      colors: {
        paper: '#f4f1e9',
        ivory: '#fcfbf8',
        ink: '#26251f',
        muted: '#6e695f',
        line: '#e2ddd3',
        olive: '#777b68',
        accent: '#a88e65',
        'accent-strong': '#826b49',
        'accent-soft': '#d7c5a5',
        night: '#24241f'
      },
      fontFamily: {
        serif: ['Italiana', 'Georgia', 'serif'],
        sans: ['DM Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif']
      },
      boxShadow: {
        '3d-sm': '0 14px 28px -6px rgba(36, 36, 31, 0.12), 0 4px 10px -2px rgba(168, 142, 101, 0.14)',
        '3d-lg': '0 28px 60px -12px rgba(24, 24, 20, 0.22), 0 12px 26px -6px rgba(168, 142, 101, 0.18)',
        '3d-xl': '0 42px 85px -16px rgba(18, 18, 15, 0.34), 0 0 24px rgba(215, 197, 165, 0.2)'
      }
    }
  },
  plugins: []
}
