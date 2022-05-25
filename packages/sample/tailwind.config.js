const colors = require('tailwindcss/colors');
const plugin = require('tailwindcss/plugin');

module.exports = {
  content: ["./src/**/*.svelte"],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        gray: colors.slate
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    plugin(
      function({ addUtilities, theme, e }) {
        addUtilities({
          '.rotate-x-180': {
            transform: 'rotateX(180deg)'
          }
        });
      }
    )
  ]
}
