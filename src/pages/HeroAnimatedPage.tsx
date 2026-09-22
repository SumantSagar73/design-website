import { useReducedMotion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'

import HeroAnimated from '../hero-animated/HeroAnimated'

/** Route wrapper for the animated-background hero at /hero-animated. */
export default function HeroAnimatedPage({ onBack }: { onBack?: () => void }) {
  const reduced = !!useReducedMotion()

  return (
    <>
      {onBack && (
        <button type="button" className="hero-anim-back" onClick={onBack}>
          <ArrowLeft size={14} /> Back
        </button>
      )}
      <HeroAnimated reducedMotion={reduced} />
    </>
  )
}
