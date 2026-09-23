import { useCallback, useRef, useState } from 'react'

import GlyphSlicer, { type SlicerHandle, type SlicerStats } from '../games/GlyphSlicer'

const SOCIALS = [
  { label: 'Instagram', href: 'https://www.instagram.com/myoperator' },
  { label: 'X', href: 'https://x.com/myoperator' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/myoperator' },
  { label: 'www.myoperator.com', href: 'https://www.myoperator.com' },
]

/**
 * The footer *is* the play area: Orbit Slicer fills the whole panel and the
 * copy floats over it, so orbitals fly up behind the wordmark. Everything
 * except the actual controls is pointer-transparent, letting a drag anywhere
 * across the footer cut. The game keeps its own score; the footer only mirrors
 * it so the pitch can react.
 */
export default function Footer() {
  const slicer = useRef<SlicerHandle>(null)
  const [stats, setStats] = useState<SlicerStats>({
    phase: 'ready',
    score: 0,
    best: 0,
    lives: 3,
  })

  /* Stable, so the child's stats effect doesn't refire every render. */
  const onStats = useCallback((s: SlicerStats) => setStats(s), [])

  return (
    <footer className="site-footer">
      <div className="footer-arena">
        <GlyphSlicer ref={slicer} bare onStats={onStats} />
      </div>

      <div className="footer-head">
        <h2 className="footer-wordmark">
          MyOrbit
          <br />
          <span className="footer-wordmark__sub">/design system</span>
        </h2>

        <div className="footer-pitch">
          <p>
            <button
              type="button"
              className="footer-play"
              onClick={() => slicer.current?.start()}
            >
              {stats.phase === 'over' ? 'PLAY AGAIN' : 'PLAY'}
            </button>{' '}
            this game,
            <br />
            {stats.phase === 'play'
              ? `${stats.score} point${stats.score === 1 ? '' : 's'} · ${'●'.repeat(Math.max(stats.lives, 0))}`
              : stats.phase === 'over'
                ? `${stats.score} points. Best ${stats.best}.`
                : 'Bet you can win.'}
          </p>
        </div>
      </div>

      <div className="footer-meta">
        <p>Copyright © {new Date().getFullYear()} MyOrbit</p>
        <nav className="footer-socials" aria-label="Social links">
          {SOCIALS.map((s, i) => (
            <span key={s.label}>
              {i > 0 && <span className="footer-socials__sep" aria-hidden="true">|</span>}
              <a href={s.href} target="_blank" rel="noreferrer noopener">
                {s.label}
              </a>
            </span>
          ))}
        </nav>
      </div>

      {stats.phase === 'ready' && (
        <p className="footer-hint">Drag anywhere to slice · along an orbital’s axis for ×2</p>
      )}
    </footer>
  )
}
