import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import RibbonImage from '../components/RibbonImage'
import { INTERACTION_VARIANTS, type InteractionMode } from '../types'
import type { VersionProps } from './types'

export default function V1Interactive({ reducedMotion }: VersionProps) {
  const [activeMode, setActiveMode] = useState<InteractionMode>(() => {
    const stored = sessionStorage.getItem('orbit-boot-mode')
    const n = stored !== null ? Number(stored) : 0
    sessionStorage.removeItem('orbit-boot-mode')
    return (n >= 0 && n <= 3 ? n : 0) as InteractionMode
  })

  // Keyboard shortcut switching: press keys 1, 2, 3, 4
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === '1') setActiveMode(0)
      else if (e.key === '2') setActiveMode(1)
      else if (e.key === '3') setActiveMode(2)
      else if (e.key === '4') setActiveMode(3)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Page-wide pointer (-1..1, y down) drives the ribbon parallax/tilt and headline counter-drift
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  useEffect(() => {
    if (reducedMotion) return
    const onMove = (e: PointerEvent) => {
      px.set((e.clientX / window.innerWidth) * 2 - 1)
      py.set((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [reducedMotion, px, py])

  const textX = useTransform(useSpring(px, { stiffness: 40, damping: 18 }), (v) => v * -2.4)
  const textY = useTransform(useSpring(py, { stiffness: 40, damping: 18 }), (v) => v * -2.0)

  return (
    <section className="hero" aria-label="MyOrbit">
      <div className="atmosphere" aria-hidden="true" />

      {/* 3D Ribbon with 4 Selectable Interactive Physics & Shader Modes */}
      <RibbonImage px={px} py={py} mode={activeMode} reducedMotion={reducedMotion} />

      {/* Top Header Navigation */}
      <header className="nav">
        <div>
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
        </div>
        <nav className="nav-links" aria-label="Primary">
          <a href="#">System</a>
          <a href="#">Components</a>
          <a href="#">Resources</a>
        </nav>
        <a className="pill" href="#">
          Get Started
        </a>
      </header>


      {/* Center Typography & Headline */}
      <motion.div className="center" style={reducedMotion ? undefined : { x: textX, y: textY }}>
        <h1 className="headline">
          <span className="line">Build</span>
          <span className="line">
            in <span className="orbit-word">Orbit.</span>
          </span>
        </h1>
        <p className="sub">A design system for what's next.</p>
      </motion.div>

      {/* Interactive Switcher Pill Dock & Mode Cue */}
      <div className="interaction-dock">
        <div className="dock-pill">
          {INTERACTION_VARIANTS.map((v) => (
            <button
              key={v.id}
              type="button"
              className={`dock-btn ${activeMode === v.id ? 'is-active' : ''}`}
              onClick={() => setActiveMode(v.id as InteractionMode)}
            >
              <span className="dock-num">{v.num}</span>
              <span className="dock-title">{v.title}</span>
            </button>
          ))}
        </div>
        <p className="dock-hint" key={activeMode}>
          {INTERACTION_VARIANTS[activeMode].hint}
        </p>
      </div>
    </section>
  )
}
