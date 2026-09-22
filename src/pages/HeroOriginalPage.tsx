import { useReducedMotion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'

import V0 from '../versions/V0'
import '../hero-animated/hero-animated.css'

/**
 * The original static-background hero (v0 "Gyroscopic Glass"), kept at
 * /hero-original for comparison now that the home page uses the animated one.
 */
export default function HeroOriginalPage({ onBack }: { onBack?: () => void }) {
  const reduced = !!useReducedMotion()

  return (
    <>
      {onBack && (
        <button type="button" className="hero-anim-back" onClick={onBack}>
          <ArrowLeft size={14} /> Back
        </button>
      )}
      <V0 reducedMotion={reduced} />
    </>
  )
}
