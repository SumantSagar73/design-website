import { useRef } from 'react'
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion'

const MANIFESTO_TEXT =
  'Built for the Humans in the AI Era, RazorSense is a design language that gives every state a feeling, every interaction a pulse, and every action a reason to feel alive, expressive, and genuinely felt.'

const words = MANIFESTO_TEXT.split(' ')

interface WordProps {
  children: string
  progress: MotionValue<number>
  range: [number, number]
}

function Word({ children, progress, range }: WordProps) {
  const opacity = useTransform(progress, range, [0.15, 1])
  const y = useTransform(progress, range, [5, 0])

  return (
    <span className="manifesto-scroll-word-wrapper">
      <motion.span style={{ opacity, y }} className="manifesto-scroll-word">
        {children}
      </motion.span>
    </span>
  )
}

export default function DesignPhilosophy() {
  const containerRef = useRef<HTMLDivElement>(null)

  // Scroll-driven progress: words appear in direct sync with scroll position
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.85', 'start 0.24'],
  })

  return (
    <section id="design-philosophy" className="content-section philosophy-section">
      <div className="section-container philosophy-manifesto-container" ref={containerRef}>
        {/* Eyebrow Bar */}
        <div className="manifesto-top-bar">
          <span className="manifesto-eyebrow">Design Philosophy</span>
        </div>

        {/* Left-Aligned Headline: Complete Words Appear Directly Driven by Scroll */}
        <h2 className="manifesto-text left-aligned">
          {words.map((word, index) => {
            const start = index / words.length
            const end = Math.min(start + 1.2 / words.length, 1)
            return (
              <Word
                key={index}
                progress={scrollYProgress}
                range={[start, end]}
              >
                {word}
              </Word>
            )
          })}
        </h2>

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
