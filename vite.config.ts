import { createRequire } from 'node:module'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const root = import.meta.dirname
const storybookSrc = path.resolve(root, '../Code/storybook-npm/src')
const require = createRequire(import.meta.url)

/**
 * The design-system components live outside this project, in a repo that has
 * its own node_modules — including its own copy of React. Left alone, Vite
 * resolves React from there for anything under `@sb` (and for the Radix
 * packages those components pull in), so the app ends up with two React
 * instances and every hook call throws "Invalid hook call".
 *
 * `resolve.dedupe` is not enough here: it does not reach into a package root
 * outside this project. Exact-match aliases onto the resolved entry files do,
 * and they apply to every module Vite touches, imported components included.
 */
const REACT_SINGLETON = [
  'react',
  'react-dom',
  'react-dom/client',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
]

const reactAliases = REACT_SINGLETON.map((id) => ({
  find: new RegExp(`^${id.replace('/', '\\/')}$`),
  replacement: require.resolve(id),
}))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      // MyOperator design-system components, consumed straight from source.
      { find: /^@sb\//, replacement: `${storybookSrc}/` },
      { find: /^@\//, replacement: `${storybookSrc}/` },
      ...reactAliases,
    ],
  },
  server: {
    fs: { allow: [root, storybookSrc] },
  },
})
