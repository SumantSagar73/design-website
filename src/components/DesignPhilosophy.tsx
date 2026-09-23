import { useRef } from 'react'
import { motion } from 'framer-motion'

import { LIQUID_MINIMAL, LIQUID_PAD, useLiquidText } from './liquidText'

const MANIFESTO_TEXT =
  'MyOrbit brings every interaction into one intentional system — where clarity guides, components connect, and every detail has a purpose.'

const words = MANIFESTO_TEXT.split(' ')

/**
 * The manifesto, rendered through the "Minimal liquid" lens: the words still
 * reveal on scroll, and hovering swells them under the cursor before they ease
 * back. The shader lives in ./liquidText.ts; the DOM text below it keeps the
 * layout, selection and screen-reader copy.
 *
 * Without WebGL or under prefers-reduced-motion the hook bails out and the
 * plain DOM heading is what shows.
 */
export default function DesignPhilosophy() {
  const sectionRef = useRef<HTMLElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLHeadingElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useLiquidText({ sectionRef, wrapRef, textRef, canvasRef, containerRef }, LIQUID_MINIMAL)

  return (
    <section ref={sectionRef} id="design-philosophy" className="content-section philosophy-section">
      <div className="section-container philosophy-manifesto-container" ref={containerRef}>
        {/* Eyebrow Bar */}
        <div className="manifesto-top-bar">
          <span className="manifesto-eyebrow">Design Philosophy</span>
        </div>

        <div className="glitch-wrap" ref={wrapRef}>
          <h2 className="manifesto-text left-aligned glitch-dom" ref={textRef}>
            {words.map((word, index) => (
              <span key={index} className="manifesto-scroll-word-wrapper" data-w>
                {word}
              </span>
            ))}
          </h2>
          <canvas
            ref={canvasRef}
            className="glitch-canvas"
            style={{ left: -LIQUID_PAD, top: -LIQUID_PAD }}
            aria-hidden="true"
          />
        </div>

        {/* Bottom Accent Line */}
        <motion.div
          className="manifesto-bottom-accent"
          initial={{ opacity: 0, scaleX: 0 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </section>
  )
}
