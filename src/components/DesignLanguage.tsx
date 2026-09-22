import { motion } from 'framer-motion'

import DetailStrip from './DetailStrip'

const EASE = [0.22, 1, 0.36, 1] as const


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
            The core
            <br />
            born from the glyph.
          </h2>
          <h3 className="glyph-subtitle">The signature</h3>
          <p className="glyph-body">
            Every edge and angle of RazorSense is pulled directly from the iconic Razorpay logo. By
            treating the glyph as our atomic core, we ensure that the entire design language is a
            natural, unmistakable extension of who we are.
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
            The pulse
            <br />
            powered by the flutes.
          </h2>
          <h3 className="glyph-subtitle">The intelligence behind the interface.</h3>
          <p className="glyph-body">
            If the glyph is the body, the Flutes are the brain. This is the dynamic, thinking, and
            conversing engine of RazorSense. It acts as a living pulse—analyzing context and subtly
            morphing to guide users effortlessly through their payment journeys.
          </p>
        </motion.div>

        <motion.div
          className="flute-panel"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1, ease: EASE }}
        >
          {/* "Built for connection", looping silently like the logo above. */}
          <video
            className="glyph-video"
            src="/Built%20for%20connection.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-label="Built for connection"
          />
        </motion.div>
      </div>

      <DetailStrip />
    </section>
  )
}
