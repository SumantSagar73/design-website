import sbConfig from '../Code/storybook-npm/tailwind.config.js'

/**
 * Tailwind is only here to render the MyOperator Storybook components
 * (imported from ../Code/storybook-npm/src) inside the showcase page.
 *
 * Preflight is OFF on purpose: the marketing site is hand-written CSS
 * (src/index.css) and Tailwind's reset would flatten the hero.
 */
/** @type {import('tailwindcss').Config} */
export default {
  ...sbConfig,
  darkMode: ['class'],
  corePlugins: { preflight: false },
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../Code/storybook-npm/src/**/*.{js,ts,jsx,tsx}',
  ],
}
