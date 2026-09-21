import HeroLayout from '../hero/HeroLayout'
import RibbonCanvas from '../ribbon/RibbonCanvas'
import type { VersionProps } from './types'

/** v3 — the orbit wraps the title: back arc behind the headline, front arc in front of it. */
export default function V3Wrap({ reducedMotion }: VersionProps) {
  return (
    <HeroLayout
      className="hero--wrap"
      front={<RibbonCanvas effects={{ layer: 'front' }} reducedMotion={reducedMotion} className="ribbon--front" />}
    >
      <RibbonCanvas effects={{ layer: 'back' }} reducedMotion={reducedMotion} />
    </HeroLayout>
  )
}
