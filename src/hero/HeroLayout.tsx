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

function Logo() {
  return (
    <a className="logo" href="#" aria-label="MyOrbit home">
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <circle
          cx="16"
          cy="16"
          r="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="68.4 7"
          transform="rotate(-64 16 16)"
        />
      </svg>
      <span>MyOrbit</span>
    </a>
  )
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

/** The shared MyOrbit hero chrome: every version only changes the ribbon layers. */
export default function HeroLayout({ children, front, textStyle, className }: Props) {
  return (
    <section className={`hero ${className ?? ''}`} aria-label="MyOrbit">
      <div className="atmosphere" aria-hidden="true" />

      {children}

      <header className="nav">
        <motion.div variants={rise} initial="hidden" animate="show" custom={0}>
          <Logo />
        </motion.div>
        <motion.nav className="nav-links" aria-label="Primary" variants={rise} initial="hidden" animate="show" custom={1}>
          <a href="#">System</a>
          <a href="#">Components</a>
          <a href="#">Resources</a>
        </motion.nav>
        <motion.a className="pill" href="#" variants={rise} initial="hidden" animate="show" custom={2}>
          Get Started
        </motion.a>
      </header>


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
