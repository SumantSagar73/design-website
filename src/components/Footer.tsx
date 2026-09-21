import { ArrowUp } from 'lucide-react'

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo">
              <svg viewBox="0 0 32 32" aria-hidden="true">
                <circle
                  cx="16"
                  cy="16"
                  r="12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="68.4 7"
                  transform="rotate(-64 16 16)"
                />
              </svg>
              <span>MyOrbit</span>
            </div>
            <p className="footer-tagline">
              The unified design system and architectural canvas powering the next generation of
              agentic interfaces.
            </p>
          </div>

          <div className="footer-nav">
            <div className="footer-col">
              <h5>Navigation</h5>
              <a href="#design-philosophy">Design Philosophy</a>
              <a href="#try-orbitsense">Try OrbitSense</a>
              <a href="#design-language">Design Language</a>
              <a href="#watch-video">Watch Video</a>
            </div>
            <div className="footer-col">
              <h5>Architecture</h5>
              <a href="#hero">Gyroscopic Glass</a>
              <a href="#hero">Refractive Shaders</a>
              <a href="#hero">Spatial Physics</a>
              <a href="#hero">Token Architecture</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} MyOrbit Design System. Built with optical glass precision.</p>
          <button className="back-to-top" onClick={scrollToTop} aria-label="Back to top">
            <span>Back to top</span>
            <ArrowUp size={15} />
          </button>
        </div>
      </div>
    </footer>
  )
}
