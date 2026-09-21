import RibbonCanvas from '../ribbon/RibbonCanvas'
import HeroLabLayout from './HeroLabLayout'

/**
 * A duplicate of the v0 "Gyroscopic Glass" hero (src/versions/V0.tsx), wired
 * to its own layout and stylesheet so it can be redesigned in isolation.
 *
 * This is the file to change when trying a new hero design.
 */
export default function HeroLab({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <HeroLabLayout>
      <RibbonCanvas effects={{ sheen: true, gyro: true }} reducedMotion={reducedMotion} />
    </HeroLabLayout>
  )
}
