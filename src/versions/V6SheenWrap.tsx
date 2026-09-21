import HeroLayout from '../hero/HeroLayout'
import RibbonCanvas from '../ribbon/RibbonCanvas'
import type { VersionProps } from './types'

/** v6 — recommended: the orbit wraps the title and light follows the cursor across the glass. */
export default function V6SheenWrap({ reducedMotion }: VersionProps) {
  return (
    <HeroLayout
      className="hero--wrap"
      front={<RibbonCanvas effects={{ layer: 'front', sheen: true }} reducedMotion={reducedMotion} className="ribbon--front" />}
    >
      <RibbonCanvas effects={{ layer: 'back', sheen: true }} reducedMotion={reducedMotion} />
    </HeroLayout>
  )
}
