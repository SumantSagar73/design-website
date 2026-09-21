import HeroLayout from '../hero/HeroLayout'
import RibbonCanvas from '../ribbon/RibbonCanvas'
import Glow from '../ribbon/Glow'
import type { VersionProps } from './types'

/** v5 — no cursor effects: a slow float, a breathing glow and a soft focus-in entrance. */
export default function V5Calm({ reducedMotion }: VersionProps) {
  return (
    <HeroLayout className="hero--calm">
      <RibbonCanvas reducedMotion={reducedMotion} className="ribbon--calm" underlay={<Glow />} />
    </HeroLayout>
  )
}
