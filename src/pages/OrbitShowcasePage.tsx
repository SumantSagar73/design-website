import { ArrowLeft, ExternalLink } from 'lucide-react'

import '../hero-animated/hero-animated.css'

/**
 * The standalone "MyOrbit — The Design System for Living Interfaces" showcase,
 * shown at /orbit-showcase.
 *
 * It ships as its own HTML file (public/orbit-showcase.html) and is framed
 * here rather than ported into the app: it brings its own Tailwind build,
 * Google fonts and state script, so framing keeps it exactly as designed and
 * keeps its styles from leaking into the rest of the site.
 */
export default function OrbitShowcasePage({ onBack }: { onBack?: () => void }) {
  return (
    <div className="embed-page">
      <div className="embed-page__bar">
        {onBack && (
          <button type="button" className="hero-anim-back embed-page__back" onClick={onBack}>
            <ArrowLeft size={14} /> Back
          </button>
        )}
        <a className="embed-page__open" href="/orbit-showcase.html" target="_blank" rel="noreferrer">
          Open full page <ExternalLink size={13} />
        </a>
      </div>
      <iframe className="embed-page__frame" src="/orbit-showcase.html" title="MyOrbit design showcase" />
    </div>
  )
}
