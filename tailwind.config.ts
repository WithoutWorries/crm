import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        fmea: {
          bg: '#09141f',
          bg2: '#0e1e2e',
          bg3: '#142840',
          border: '#1c3550',
          border2: '#254e70',
          text: '#d0e8f8',
          dim: '#5c85a0',
          hi: '#f0faff',
          accent: '#00d4e8',
          accent2: '#ffaa00',
          nav: '#06101a',
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config
