import { useReducedMotion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'

import HeroLab from '../hero-lab/HeroLab'

/** Route wrapper for the hero sandbox at /hero-lab. */
export default function HeroLabPage({ onBack }: { onBack?: () => void }) {
  const reduced = !!useReducedMotion()

  return (
    <>
      {onBack && (
        <button type="button" className="hero-lab-back" onClick={onBack}>
          <ArrowLeft size={14} /> Back
        </button>
      )}
      <HeroLab reducedMotion={reduced} />
    </>
  )
}
