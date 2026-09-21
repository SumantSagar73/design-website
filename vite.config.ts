import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const root = import.meta.dirname
const dsSrc = path.resolve(root, 'src/vendor/ds')

/**
 * The MyOperator design-system components are vendored into src/vendor/ds
 * rather than imported from the sibling storybook repo. That repo is not
 * present on a build machine, so aliasing to it built locally and failed
 * everywhere else. See src/vendor/ds/README.md for how to refresh them.
 *
 * Vendoring also removed a duplicate-React hazard: the sibling repo has its
 * own node_modules, so components imported from it pulled in a second React
 * and every hook call threw.
 */
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      // MyOperator design-system components, vendored into this repo.
      { find: /^@sb\//, replacement: `${dsSrc}/` },
      { find: /^@\//, replacement: `${dsSrc}/` },
    ],
  },
})
