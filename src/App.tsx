import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import Navbar from './components/Navbar'
import V0 from './versions/V0'
import DesignPhilosophy from './components/DesignPhilosophy'
import TryOrbitSense from './components/TryOrbitSense'
import DesignLanguage from './components/DesignLanguage'
import WatchVideo from './components/WatchVideo'
import Footer from './components/Footer'
import ShowcasePage from './pages/ShowcasePage'
import MosaicPage from './pages/MosaicPage'
import HeroLabPage from './pages/HeroLabPage'

/**
 * Main application entry point.
 * Supports standard single-page marketing flow at '/'
 * and dedicated Storybook Showcase at '/showcase' (or '#showcase').
 */
export default function App() {
  const reduced = !!useReducedMotion()
  
  const getIsShowcaseRoute = () => {
    if (typeof window === 'undefined') return false
    const path = window.location.pathname.toLowerCase()
    const hash = window.location.hash.toLowerCase()
    return (
      path.includes('showcase') ||
      path.includes('storybook') ||
      path.includes('deliberate') ||
      hash === '#showcase' ||
      hash === '#storybook'
    )
  }

  const getIsMosaicRoute = () => {
    if (typeof window === 'undefined') return false
    const path = window.location.pathname.toLowerCase()
    const hash = window.location.hash.toLowerCase()
    return path.includes('mosaic') || hash === '#mosaic'
  }

  const getIsHeroLabRoute = () => {
    if (typeof window === 'undefined') return false
    const path = window.location.pathname.toLowerCase()
    const hash = window.location.hash.toLowerCase()
    return path.includes('hero-lab') || hash === '#hero-lab'
  }

  const [isShowcase, setIsShowcase] = useState(getIsShowcaseRoute)
  const [isMosaic, setIsMosaic] = useState(getIsMosaicRoute)
  const [isHeroLab, setIsHeroLab] = useState(getIsHeroLabRoute)

  useEffect(() => {
    const handleLocationChange = () => {
      setIsShowcase(getIsShowcaseRoute())
      setIsMosaic(getIsMosaicRoute())
      setIsHeroLab(getIsHeroLabRoute())
    }

    window.addEventListener('popstate', handleLocationChange)
    window.addEventListener('hashchange', handleLocationChange)
    return () => {
      window.removeEventListener('popstate', handleLocationChange)
      window.removeEventListener('hashchange', handleLocationChange)
    }
  }, [])

  const navigateToHome = () => {
    window.history.pushState({}, '', '/')
    setIsShowcase(false)
    setIsMosaic(false)
    setIsHeroLab(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (isHeroLab) {
    return <HeroLabPage onBack={navigateToHome} />
  }

  if (isMosaic) {
    return <MosaicPage onBack={navigateToHome} />
  }

  if (isShowcase) {
    return <ShowcasePage onBack={navigateToHome} />
  }

  return (
    <div className="app-single-page">
      <Navbar />
      <main>
        <div id="hero">
          <V0 reducedMotion={reduced} />
        </div>
        <DesignPhilosophy />
        <TryOrbitSense />
        <DesignLanguage />
        <WatchVideo />
      </main>
      <Footer />
    </div>
  )
}

