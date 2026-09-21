import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, X, Volume2, Sparkles, Film } from 'lucide-react'

export default function WatchVideo() {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <section id="watch-video" className="content-section video-section">
      <div className="section-container">
        <div className="section-header">
          <motion.span
            className="section-eyebrow"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            04 / Cinematic Showcase
          </motion.span>
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            Watch the Design Philosophy in Motion
          </motion.h2>
          <motion.p
            className="section-lead"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            A visual and sonic keynote demonstrating how optical physics and agentic interactions
            converge to create the next paradigm in product design.
          </motion.p>
        </div>

        {/* Video Cinema Preview Card */}
        <div className="video-card-container">
          <div className="video-preview-card" onClick={() => setIsPlaying(true)}>
            {/* Ambient background glow */}
            <div className="video-ambient-glow" />

            {/* Poster graphic with glass overlay */}
            <div className="video-poster">
              <div className="poster-backdrop">
                <div className="poster-orbit-ring" />
                <div className="poster-headline">
                  <span>MyOrbit</span>
                  <small>Agentic Spatial Architecture</small>
                </div>
              </div>

              {/* Play Button */}
              <button
                className="video-play-btn"
                aria-label="Play Presentation Video"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsPlaying(true)
                }}
              >
                <div className="play-pulse-ring" />
                <div className="play-pulse-ring delay" />
                <Play size={28} className="play-icon" fill="currentColor" />
              </button>

              {/* Top Badges */}
              <div className="video-top-badges">
                <span className="badge-film">
                  <Film size={13} />
                  Official Keynote
                </span>
                <span className="badge-duration">
                  <Volume2 size={13} />
                  Spatial Audio • 03:20
                </span>
              </div>

              {/* Bottom Caption */}
              <div className="video-bottom-caption">
                <h4>Chapter 01: The Emergence of Autonomous Interfaces</h4>
                <p>Featuring live demos of optical caustics, gyroscopic breath, and adaptive context routing.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Video Modal Player */}
        <AnimatePresence>
          {isPlaying && (
            <motion.div
              className="video-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPlaying(false)}
            >
              <motion.div
                className="video-modal-content"
                initial={{ scale: 0.94, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.94, opacity: 0, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="modal-close-btn"
                  onClick={() => setIsPlaying(false)}
                  aria-label="Close Video"
                >
                  <X size={20} />
                </button>

                <div className="modal-player-screen">
                  {/* Simulated High-Res Video Showcase Animation */}
                  <div className="player-animation-canvas">
                    <div className="player-orbit-simulation">
                      <div className="sim-ring outer" />
                      <div className="sim-ring middle" />
                      <div className="sim-ring inner" />
                      <div className="sim-center-text">
                        <Sparkles size={32} className="sim-icon" />
                        <h3>MyOrbit in Action</h3>
                        <p>Living Agentic Interfaces & Spatial Light Physics</p>
                      </div>
                    </div>
                  </div>

                  <div className="player-control-strip">
                    <div className="strip-progress">
                      <div className="strip-progress-bar" />
                    </div>
                    <div className="strip-controls">
                      <span>01:42 / 03:20</span>
                      <span>4K Ultra HD • Spatial Audio</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
