import HeroLayout from '../hero/HeroLayout'
import RibbonCanvas from '../ribbon/RibbonCanvas'
import Glow from '../ribbon/Glow'
import type { VersionProps } from './types'

/** v7 — depth without interaction: the wrapped orbit floats and breathes. */
export default function V7WrapCalm({ reducedMotion }: VersionProps) {
  return (
    <HeroLayout
      className="hero--wrap hero--calm"
      front={<RibbonCanvas effects={{ layer: 'front' }} reducedMotion={reducedMotion} className="ribbon--front ribbon--calm" />}
    >
      <RibbonCanvas effects={{ layer: 'back' }} reducedMotion={reducedMotion} className="ribbon--calm" underlay={<Glow />} />
    </HeroLayout>
  )
}
