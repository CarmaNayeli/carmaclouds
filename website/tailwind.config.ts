import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        carma: {
          purple: '#8B5CF6',
          blue: '#3B82F6',
          orange: '#F97316',
        }
      }
    },
  },
  plugins: [],
}
export default config
