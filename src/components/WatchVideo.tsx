import { useState } from 'react'
import { motion } from 'framer-motion'

import GlyphArt from './GlyphArt'

/**
 * The video to play. Set one of these:
 *  - youtubeId: the id from a YouTube link (youtube.com/watch?v=<id>)
 *  - src: a direct video file, e.g. '/razorsense.mp4' in public/
 * With neither set, the poster shows but the play button does nothing.
 */
const VIDEO = {
  youtubeId: '',
  src: '',
}

const EASE = [0.22, 1, 0.36, 1] as const

export default function WatchVideo() {
  const [playing, setPlaying] = useState(false)
  const hasVideo = Boolean(VIDEO.youtubeId || VIDEO.src)

  const play = () => {
    if (!hasVideo) {
      console.warn('[WatchVideo] No video set: add a youtubeId or src in src/components/WatchVideo.tsx')
      return
    }
    setPlaying(true)
  }

  return (
    <section id="watch-video" className="video-section">
      <motion.div
        className="video-frame"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.9, ease: EASE }}
      >
        {playing ? (
          VIDEO.youtubeId ? (
            <iframe
              className="video-embed"
              src={`https://www.youtube-nocookie.com/embed/${VIDEO.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
              title="RazorSense"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : (
            <video className="video-embed" src={VIDEO.src} autoPlay controls playsInline />
          )
        ) : (
          <button type="button" className="video-poster" onClick={play} aria-label="Play the RazorSense video">
            <GlyphArt className="video-poster__glyph" softness={16} haloBlur={34} />
            {/* White text with a difference blend: it reads black on the pale
                poster and turns gold where it crosses the blue glyph. */}
            <span className="video-poster__wordmark" aria-hidden="true">
              RazorSense
            </span>
            <span className="video-poster__play" aria-hidden="true">
              <svg viewBox="0 0 68 48" width="68" height="48">
                <path
                  d="M66.5 7.7a8.5 8.5 0 0 0-6-6C55.2.3 34 .3 34 .3s-21.2 0-26.5 1.4a8.5 8.5 0 0 0-6 6C.1 13 .1 24 .1 24s0 11 1.4 16.3a8.5 8.5 0 0 0 6 6C12.8 47.7 34 47.7 34 47.7s21.2 0 26.5-1.4a8.5 8.5 0 0 0 6-6C67.9 35 67.9 24 67.9 24s0-11-1.4-16.3z"
                  fill="#f00"
                />
                <path d="M27 34.3 45 24 27 13.7z" fill="#fff" />
              </svg>
            </span>
          </button>
        )}
      </motion.div>
    </section>
  )
}
