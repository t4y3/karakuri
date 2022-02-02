const colors = require('tailwindcss/colors');

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
  ]
}
