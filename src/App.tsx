import { useReducedMotion } from 'framer-motion'
import V0 from './versions/V0'

/**
 * Main application entry point.
 * Renders v0 as the primary design.
 */
export default function App() {
  const reduced = !!useReducedMotion()

  return <V0 reducedMotion={reduced} />
}
