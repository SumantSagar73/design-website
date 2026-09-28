import { useState } from 'react'
import { motion } from 'framer-motion'

/**
 * The video to play. The first of these that is set wins.
 *  - src: a direct video file, e.g. '/orbit.mp4' in public/. Preferred — it is
 *    the only option we style and control end to end.
 *  - youtubeId: the id from a YouTube link (youtube.com/watch?v=<id>)
 *  - driveId: the id from a Drive link (drive.google.com/file/d/<id>/view).
 *    The file must be shared as "anyone with the link". Drive renders its own
 *    player chrome and is rate-limited, so treat this as a stopgap.
 * With none set, the poster shows but the play button does nothing.
 */
const VIDEO = {
  src: '',
  youtubeId: '-7AwvxNwz4U',
  driveId: '',
}

const EASE = [0.22, 1, 0.36, 1] as const

export default function WatchVideo() {
  const [playing, setPlaying] = useState(false)
  const hasVideo = Boolean(VIDEO.src || VIDEO.youtubeId || VIDEO.driveId)

  const play = () => {
    if (!hasVideo) {
      console.warn('[WatchVideo] No video set: add a src, youtubeId or driveId in src/components/WatchVideo.tsx')
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
          VIDEO.src ? (
            <video className="video-embed" src={VIDEO.src} autoPlay controls playsInline />
          ) : VIDEO.youtubeId ? (
            <iframe
              className="video-embed"
              src={`https://www.youtube-nocookie.com/embed/${VIDEO.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
              title="MyOrbit"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : (
            /* Drive ignores autoplay params, so this lands on its own play
               button — in the same spot the poster's was. */
            <iframe
              className="video-embed"
              src={`https://drive.google.com/file/d/${VIDEO.driveId}/preview`}
              title="MyOrbit"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
            />
          )
        ) : (
          <button type="button" className="video-poster" onClick={play} aria-label="Play the MyOrbit video">
            <span className="video-poster__sheen" aria-hidden="true" />
            {/* Sized like a real player's control rather than a hero element:
                big enough to hit, small enough that the poster does not read as
                a second video player sitting inside the first. The glass and
                its shine are the same language the navbar pill uses. */}
            <span className="video-poster__play" aria-hidden="true">
              <svg className="video-poster__play-icon" viewBox="0 0 24 24">
                <path d="M8 5 19 12 8 19z" fill="currentColor" />
              </svg>
            </span>
          </button>
        )}
      </motion.div>
    </section>
  )
}
