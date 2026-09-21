import type { ReactNode } from 'react'
import { motion, type MotionStyle, type Variants } from 'framer-motion'

import FluidBackdrop from './FluidBackdrop'
import './hero-lab.css'

const EASE = [0.22, 1, 0.36, 1] as const

const rise: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 1.2, ease: EASE, delay: 0.35 + i * 0.12 },
  }),
}

type Props = {
  /** Layer behind the headline (the ribbon, or its back half). */
  children?: ReactNode
  /** Layer above the headline (e.g. the ribbon's front arc). */
  front?: ReactNode
  /** Motion applied to the headline block (e.g. parallax counter-drift). */
  textStyle?: MotionStyle
  /** Extra modifier on the section. */
  className?: string
}

/**
 * An editable duplicate of src/hero/HeroLayout.tsx.
 *
 * Identical markup and motion, but every class is namespaced `hero-lab__*`
 * and styled by ./hero-lab.css, so changes here never reach the live hero.
 */
export default function HeroLabLayout({ children, front, textStyle, className }: Props) {
  return (
    <section className={`hero-lab ${className ?? ''}`} aria-label="MyOrbit hero lab">
      {/* The static gradient stays underneath as the paint-time and
          no-WebGL fallback; the fluid field draws over it. */}
      <div className="hero-lab__atmosphere" aria-hidden="true" />
      <FluidBackdrop className="hero-lab__fluid" />

      {children}

      <motion.div className="hero-lab__center" style={textStyle}>
        <h1 className="hero-lab__headline">
          <motion.span
            className="hero-lab__line"
            variants={rise}
            initial="hidden"
            animate="show"
            custom={1}
          >
            Build
          </motion.span>
          <motion.span
            className="hero-lab__line"
            variants={rise}
            initial="hidden"
            animate="show"
            custom={2}
          >
            in <span className="hero-lab__orbit">Orbit.</span>
          </motion.span>
        </h1>
        <motion.p
          className="hero-lab__sub"
          variants={rise}
          initial="hidden"
          animate="show"
          custom={3}
        >
          A design system for what’s next.
        </motion.p>
      </motion.div>

      {front}
    </section>
  )
}
