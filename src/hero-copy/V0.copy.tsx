import HeroLayout from '../hero/HeroLayout'
import RibbonCanvas from '../ribbon/RibbonCanvas'
import type { VersionProps } from '../versions/types'

/**
 * UNTOUCHED HERO COPY - DO NOT MODIFY.
 * v0 — Gyroscopic Glass (Main Design).
 * A still orbit breathing under its own weight; light follows the cursor.
 * The orbit pulses from the inside while the artwork and headline hold still.
 */
export default function V0Copy({ reducedMotion }: VersionProps) {
  return (
    <HeroLayout>
      <RibbonCanvas effects={{ sheen: true, gyro: true }} reducedMotion={reducedMotion} />
    </HeroLayout>
  )
}
