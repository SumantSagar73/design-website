import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import Navbar from './components/Navbar'
import HeroAnimated from './hero-animated/HeroAnimated'
import Footer from './components/Footer'
import DesignPhilosophy from './components/DesignPhilosophy'
import TryOrbitSense from './components/TryOrbitSense'
import DesignLanguage from './components/DesignLanguage'
import WatchVideo from './components/WatchVideo'
import MosaicPage from './pages/MosaicPage'
import HeroLabPage from './pages/HeroLabPage'
import HeroAnimatedPage from './pages/HeroAnimatedPage'
import HeroOriginalPage from './pages/HeroOriginalPage'
import PhilosophyLab from './philosophy-lab/PhilosophyLab'
import GamesLab from './games/GamesLab'
import { GLITCH_VARIANTS } from './philosophy-lab/glitch'

/**
 * Main application entry point.
 * Supports standard single-page marketing flow at '/'
 * plus the standalone lab and showcase routes below.
 */
export default function App() {
  const reduced = !!useReducedMotion()
  
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

  const getIsHeroAnimatedRoute = () => {
    if (typeof window === 'undefined') return false
    const path = window.location.pathname.toLowerCase()
    const hash = window.location.hash.toLowerCase()
    return path.includes('hero-animated') || hash === '#hero-animated'
  }

  const getIsPhilosophyLabRoute = () => {
    if (typeof window === 'undefined') return false
    const path = window.location.pathname.toLowerCase()
    const hash = window.location.hash.toLowerCase()
    return path.includes('philosophy-lab') || hash === '#philosophy-lab'
  }

  const getIsPhilosophyGlitchRoute = () => {
    if (typeof window === 'undefined') return false
    const path = window.location.pathname.toLowerCase()
    const hash = window.location.hash.toLowerCase()
    return path.includes('philosophy-glitch') || hash === '#philosophy-glitch'
  }

  const getIsHeroOriginalRoute = () => {
    if (typeof window === 'undefined') return false
    const path = window.location.pathname.toLowerCase()
    const hash = window.location.hash.toLowerCase()
    return path.includes('hero-original') || hash === '#hero-original'
  }

  const getIsGamesRoute = () => {
    if (typeof window === 'undefined') return false
    const path = window.location.pathname.toLowerCase()
    const hash = window.location.hash.toLowerCase()
    return path.startsWith('/games') || hash === '#games'
  }

  const [isMosaic, setIsMosaic] = useState(getIsMosaicRoute)
  const [isHeroLab, setIsHeroLab] = useState(getIsHeroLabRoute)
  const [isHeroAnimated, setIsHeroAnimated] = useState(getIsHeroAnimatedRoute)
  const [isHeroOriginal, setIsHeroOriginal] = useState(getIsHeroOriginalRoute)
  const [isGames, setIsGames] = useState(getIsGamesRoute)
  const [isPhilosophyLab, setIsPhilosophyLab] = useState(getIsPhilosophyLabRoute)
  const [isPhilosophyGlitch, setIsPhilosophyGlitch] = useState(getIsPhilosophyGlitchRoute)

  useEffect(() => {
    const handleLocationChange = () => {
      setIsMosaic(getIsMosaicRoute())
      setIsHeroLab(getIsHeroLabRoute())
      setIsHeroAnimated(getIsHeroAnimatedRoute())
      setIsHeroOriginal(getIsHeroOriginalRoute())
      setIsGames(getIsGamesRoute())
      setIsPhilosophyLab(getIsPhilosophyLabRoute())
      setIsPhilosophyGlitch(getIsPhilosophyGlitchRoute())
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
    setIsMosaic(false)
    setIsHeroLab(false)
    setIsHeroAnimated(false)
    setIsHeroOriginal(false)
    setIsGames(false)
    setIsPhilosophyLab(false)
    setIsPhilosophyGlitch(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (isPhilosophyGlitch) {
    return (
      <PhilosophyLab
        onBack={navigateToHome}
        variants={GLITCH_VARIANTS}
        title="Design Philosophy · hover glitch"
        hint="Scroll down, then hover the text"
      />
    )
  }

  if (isPhilosophyLab) {
    return <PhilosophyLab onBack={navigateToHome} />
  }

  if (isGames) {
    return <GamesLab onBack={navigateToHome} />
  }

  if (isHeroOriginal) {
    return <HeroOriginalPage onBack={navigateToHome} />
  }

  if (isHeroAnimated) {
    return <HeroAnimatedPage onBack={navigateToHome} />
  }

  if (isHeroLab) {
    return <HeroLabPage onBack={navigateToHome} />
  }

  if (isMosaic) {
    return <MosaicPage onBack={navigateToHome} />
  }

  return (
    <div className="app-single-page">
      <Navbar />
      <main>
        <div id="hero">
          <HeroAnimated reducedMotion={reduced} />
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

