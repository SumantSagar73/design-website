import type { ReactNode } from 'react'
import { motion, type MotionStyle, type Variants } from 'framer-motion'

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
  /** Version-specific modifier on the hero, e.g. "hero--wrap". */
  className?: string
}

/**
 * UNTOUCHED HERO COPY - DO NOT MODIFY.
 * The shared MyOrbit hero chrome: renders the atmosphere, ribbon, and center headline.
 */
export default function HeroLayoutCopy({ children, front, textStyle, className }: Props) {
  return (
    <section className={`hero ${className ?? ''}`} aria-label="MyOrbit">
      <div className="atmosphere" aria-hidden="true" />

      {children}

      <motion.div className="center" style={textStyle}>
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

      {front}
    </section>
  )
}
