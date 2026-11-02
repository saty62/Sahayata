/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#245C46',
          dark: '#1B4736',
          light: '#2E7559',
          hover: '#1e4d3a',
        },
        sage: {
          DEFAULT: '#DCE9DF',
          light: '#EDF4EE',
          dark: '#BACFC0',
        },
        ivory: {
          DEFAULT: '#FAF9F6',
          card: '#FFFFFF',
          border: '#E8E5DD',
        },
        charcoal: {
          DEFAULT: '#252B27',
          muted: '#5A635E',
          light: '#8E9992',
        },
        accent: {
          DEFAULT: '#E9AD65',
          dark: '#D08F42',
          light: '#F5CE98',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Devanagari', 'sans-serif'],
        hindi: ['Noto Sans Devanagari', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft-sm': '0 1px 3px rgba(36, 92, 70, 0.05)',
        'soft-md': '0 4px 12px rgba(36, 92, 70, 0.08)',
        'soft-lg': '0 8px 24px rgba(36, 92, 70, 0.10)',
      },
    },
  },
  plugins: [],
};
