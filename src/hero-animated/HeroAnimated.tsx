import { useRef } from 'react'
import { motion, type Variants } from 'framer-motion'

import RibbonCanvas from '../ribbon/RibbonCanvas'
import AnimatedAtmosphere from './AnimatedAtmosphere'
import './hero-animated.css'

const EASE = [0.22, 1, 0.36, 1] as const

const rise: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 1.2, ease: EASE, delay: 0.35 + i * 0.12 },
  }),
}

/**
 * A duplicate of the v0 hero (src/versions/V0.tsx + src/hero/HeroLayout.tsx)
 * whose background gradient moves and reacts to the cursor.
 *
 * It reuses the live hero's classes (.hero, .center, .headline …) so the
 * chrome stays identical; only the static .atmosphere is swapped for
 * AnimatedAtmosphere.
 */
export default function HeroAnimated({ reducedMotion }: { reducedMotion: boolean }) {
  const ref = useRef<HTMLElement>(null)

  return (
    <section ref={ref} className="hero hero-anim" aria-label="MyOrbit (animated background)">
      <AnimatedAtmosphere targetRef={ref} reducedMotion={reducedMotion} />

      <RibbonCanvas effects={{ sheen: true, gyro: true }} reducedMotion={reducedMotion} />

      <motion.div className="center">
        <h1 className="headline">
          <motion.span className="line" variants={rise} initial="hidden" animate="show" custom={1}>
            Build
          </motion.span>
          <motion.span className="line" variants={rise} initial="hidden" animate="show" custom={2}>
            in <span className="orbit-word">Orbit.</span>
          </motion.span>
        </h1>
        <motion.p className="sub" variants={rise} initial="hidden" animate="show" custom={3}>
          A design system for what’s next.
        </motion.p>
      </motion.div>
    </section>
  )
}
