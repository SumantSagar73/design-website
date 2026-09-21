import HeroLayout from '../hero/HeroLayout'
import RibbonCanvas from '../ribbon/RibbonCanvas'
import type { VersionProps } from './types'

/** v2 — the artwork stays still; a soft pastel light follows the cursor across the glass. */
export default function V2Sheen({ reducedMotion }: VersionProps) {
  return (
    <HeroLayout>
      <RibbonCanvas effects={{ sheen: true }} reducedMotion={reducedMotion} />
    </HeroLayout>
  )
}
