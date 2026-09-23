import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

import DetailStrip from './DetailStrip'

const EASE = [0.22, 1, 0.36, 1] as const


/**
 * A silent looping video that restarts `trimEnd` seconds before its real end,
 * skipping frames at the tail (e.g. a black frame baked into the export).
 * Checked every animation frame, so the jump lands within one frame.
 */
function TrimmedLoopVideo({ src, trimEnd, className, label }: { src: string; trimEnd: number; className?: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const v = ref.current
    if (!v) return
    let raf = 0
    const tick = () => {
      if (v.duration && v.currentTime >= v.duration - trimEnd) {
        v.currentTime = 0
        void v.play().catch(() => {})
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    /* backstop: if it ever does reach the end, restart immediately */
    const onEnded = () => {
      v.currentTime = 0
      void v.play().catch(() => {})
    }
    v.addEventListener('ended', onEnded)
    return () => {
      cancelAnimationFrame(raf)
      v.removeEventListener('ended', onEnded)
    }
  }, [trimEnd])
  return <video ref={ref} className={className} src={src} autoPlay muted playsInline preload="auto" aria-label={label} />
}

export default function DesignLanguage() {
  return (
    <section id="design-language" className="content-section glyph-section">
      <div className="glyph-grid">
        <motion.div
          className="glyph-copy"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <h2 className="glyph-title">
            Driven by
            <br />
            possibility
          </h2>
          <h3 className="glyph-subtitle">The vision</h3>
          <p className="glyph-body">
            MyOrbit establishes a circle of control for designers and users alike. The Orbital
            carries that vision forward with endless possibility. Its fluid, progressive geometry
            signals where our design language is headed next.
          </p>
        </motion.div>

        <motion.div
          className="glyph-panel"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1, ease: EASE }}
        >
          {/* The MyOrbit logo animation, looping silently. Muted + playsInline
              are what let browsers autoplay it, including on iOS. */}
          <video
            className="glyph-video"
            src="/MyOrbit%20Logo.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-label="MyOrbit logo animation"
          />
        </motion.div>
      </div>

      {/* Second row, mirrored: the Flutes (Ray's conversational layer). */}
      <div className="glyph-grid glyph-grid--reverse">
        <motion.div
          className="glyph-copy"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <h2 className="glyph-title">
            Built for
            <br />
            connection
          </h2>
          <h3 className="glyph-subtitle">The foundation</h3>
          <p className="glyph-body">
            Every element of MyOrbit is shaped by connection. Atomic components come together to
            create cohesive experiences, reflecting how conversations flow between people, teams,
            and technology.
          </p>
        </motion.div>

        <motion.div
          className="flute-panel"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1, ease: EASE }}
        >
          {/* "Built for connection". Its last few frames are black, so it loops
              itself just before them instead of using the native loop. */}
          <TrimmedLoopVideo
            className="glyph-video glyph-video--fit"
            src="/Built%20for%20connection.mp4"
            trimEnd={0.15}
            label="Built for connection"
          />
        </motion.div>
      </div>

      <DetailStrip />
    </section>
  )
}
