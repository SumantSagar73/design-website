import HeroLayout from '../hero/HeroLayout'
import RibbonCanvas from '../ribbon/RibbonCanvas'
import type { VersionProps } from './types'

/**
 * v0 — Gyroscopic Glass. Glass Sheen's cursor-tracked light over Gyroscopic
 * Inertia's breath, with the inertia physics dropped: nothing about the page
 * translates or tilts. The orbit pulses from the inside instead, so the hero
 * stays alive while the artwork and the headline hold perfectly still.
 */
export default function VGyroSheen({ reducedMotion }: VersionProps) {
  return (
    <HeroLayout>
      <RibbonCanvas effects={{ sheen: true, gyro: true }} reducedMotion={reducedMotion} />
    </HeroLayout>
  )
}
