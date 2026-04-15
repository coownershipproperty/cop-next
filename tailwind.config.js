/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        blue:   '#2C4A5E',
        cream:  '#F5F2EC',
        gold:   '#C9A84C',
        text:   '#1a2533',
        muted:  '#5a6a7a',
        border: '#e8e0d4',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:  ['"Nunito Sans"', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        site: '1400px',
      },
    },
  },
  plugins: [],
}

