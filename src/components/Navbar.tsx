import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export type NavItem = {
  id: string
  label: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'design-philosophy', label: 'Design Philosophy' },
  { id: 'try-orbitsense', label: 'Try OrbitSense' },
  { id: 'design-language', label: 'Design Language' },
  { id: 'watch-video', label: 'Watch Video' },
]

export default function Navbar() {
  const [activeSection, setActiveSection] = useState<string>('')
  const [mobileOpen, setMobileOpen] = useState(false)

  const isScrollingRef = useRef(false)
  const animFrameRef = useRef<number | null>(null)

  const cancelSmoothScroll = () => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
  }

  const smoothScrollToTarget = (targetY: number) => {
    cancelSmoothScroll()
    isScrollingRef.current = true

    const startY = window.scrollY
    const distance = targetY - startY

    if (Math.abs(distance) < 2) {
      window.scrollTo(0, targetY)
      isScrollingRef.current = false
      return
    }

    // Adaptive duration between 480ms and 780ms based on distance
    const duration = Math.min(Math.max(Math.abs(distance) * 0.42, 480), 780)
    const startTime = performance.now()

    // Smooth cubic ease-in-out: gentle start, fast glide, soft deceleration
    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeInOutCubic(progress)

      window.scrollTo(0, Math.round(startY + distance * eased))

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step)
      } else {
        window.scrollTo(0, targetY)
        animFrameRef.current = null
        setTimeout(() => {
          isScrollingRef.current = false
        }, 60)
      }
    }

    animFrameRef.current = requestAnimationFrame(step)
  }

  const scrollTo = (id: string) => {
    setMobileOpen(false)
    setActiveSection(id)

    const el = document.getElementById(id)
    if (el) {
      const navOffset = 84
      const rect = el.getBoundingClientRect()
      const targetY = Math.max(0, rect.top + window.scrollY - navOffset)
      smoothScrollToTarget(targetY)
    }
  }

  const scrollToTop = () => {
    setMobileOpen(false)
    setActiveSection('')
    smoothScrollToTarget(0)
  }

  // Allow user wheel or touch interaction to immediately interrupt programmatic scrolling
  useEffect(() => {
    const handleUserInterrupt = () => {
      if (isScrollingRef.current) {
        cancelSmoothScroll()
        isScrollingRef.current = false
      }
    }

    window.addEventListener('wheel', handleUserInterrupt, { passive: true })
    window.addEventListener('touchmove', handleUserInterrupt, { passive: true })
    return () => {
      window.removeEventListener('wheel', handleUserInterrupt)
      window.removeEventListener('touchmove', handleUserInterrupt)
      cancelSmoothScroll()
    }
  }, [])

  // Scrollspy to detect currently visible section
  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      if (isScrollingRef.current) return
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY
          if (scrollY < 180) {
            setActiveSection('')
            ticking = false
            return
          }

          // Check if at the bottom of the page
          const isAtBottom =
            window.innerHeight + scrollY >= document.documentElement.scrollHeight - 60
          if (isAtBottom) {
            setActiveSection(NAV_ITEMS[NAV_ITEMS.length - 1].id)
            ticking = false
            return
          }

          let current = ''
          for (let i = NAV_ITEMS.length - 1; i >= 0; i--) {
            const item = NAV_ITEMS[i]
            const el = document.getElementById(item.id)
            if (el) {
              const rect = el.getBoundingClientRect()
              if (rect.top <= 260) {
                current = item.id
                break
              }
            }
          }
          setActiveSection(current)
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <header className="navbar-wrapper">
      <nav className="floating-navbar" aria-label="Main Navigation">
        {/* Left: Brand Logo */}
        <button
          className="navbar-brand"
          onClick={scrollToTop}
          aria-label="MyOrbit Home"
        >
          <svg className="navbar-logo-icon" viewBox="0 0 32 32" aria-hidden="true">
            <circle
              cx="16"
              cy="16"
              r="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeDasharray="68.4 7"
              transform="rotate(-64 16 16)"
            />
          </svg>
          <span className="navbar-brand-name">MyOrbit</span>
        </button>

        {/* Right: Navigation Links with Animated Indicator Pill */}
        <div className="navbar-links" role="tablist">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id
            return (
              <motion.button
                key={item.id}
                role="tab"
                aria-selected={isActive}
                whileTap={{ scale: 0.96 }}
                className={`navbar-link ${isActive ? 'is-active' : ''}`}
                onClick={() => scrollTo(item.id)}
              >
                {isActive && (
                  <motion.span
                    layoutId="navbar-active-pill"
                    className="navbar-active-pill"
                    transition={{
                      type: 'spring',
                      stiffness: 380,
                      damping: 30,
                      mass: 0.7,
                    }}
                  />
                )}
                <span className="navbar-link-text">{item.label}</span>
              </motion.button>
            )
          })}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="navbar-mobile-toggle"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label={mobileOpen ? 'Close Menu' : 'Open Menu'}
          aria-expanded={mobileOpen}
        >
          <span className={`hamburger-bar ${mobileOpen ? 'open' : ''}`} />
          <span className={`hamburger-bar ${mobileOpen ? 'open' : ''}`} />
        </button>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="navbar-mobile-menu"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id
              return (
                <button
                  key={item.id}
                  className={`navbar-mobile-link ${isActive ? 'is-active' : ''}`}
                  onClick={() => scrollTo(item.id)}
                >
                  {isActive && (
                    <motion.span
                      layoutId="navbar-mobile-active-pill"
                      className="navbar-mobile-active-pill"
                      transition={{
                        type: 'spring',
                        stiffness: 380,
                        damping: 30,
                        mass: 0.7,
                      }}
                    />
                  )}
                  <span className="navbar-link-text">{item.label}</span>
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}


