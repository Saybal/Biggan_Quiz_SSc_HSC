/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:          '#0d0f1a',
        card:        '#161927',
        card2:       '#1e2235',
        border:      '#2a2f48',
        accent:      '#f7c948',
        accent2:     '#ff6b6b',
        green:       '#43e97b',
        blue:        '#38b2f5',
        purple:      '#a78bfa',
        orange:      '#fb923c',
        muted:       '#7a7f9a',
        textprimary: '#e8eaf0',
      },
      fontFamily: {
        display: ['"Baloo Da 2"', 'cursive'],
        body:    ['"Hind Siliguri"', 'sans-serif'],
      },
      borderRadius: { card: '18px' },
    },
  },
  plugins: [],
}
