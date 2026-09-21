import sbConfig from './src/vendor/ds/tailwind.config.js'

/**
 * Tailwind is only here to render the MyOperator Storybook components
 * (vendored in src/vendor/ds) inside the showcase page.
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
  ],
}
