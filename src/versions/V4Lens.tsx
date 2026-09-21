import HeroLayout from '../hero/HeroLayout'
import RibbonCanvas from '../ribbon/RibbonCanvas'
import type { VersionProps } from './types'

/** v4 — a small liquid-glass lens magnifies the ribbon wherever the cursor rests on it. */
export default function V4Lens({ reducedMotion }: VersionProps) {
  return (
    <HeroLayout>
      <RibbonCanvas effects={{ lens: true }} reducedMotion={reducedMotion} />
    </HeroLayout>
  )
}
