import { useEffect, useState, type ComponentType } from 'react'
import { ArrowLeft } from 'lucide-react'

import BuildGlyph from './BuildGlyph'
import CausticCatch from './CausticCatch'
import FluteRunner from './FluteRunner'
import GlyphMemory from './GlyphMemory'
import OrbitSnake from './OrbitSnake'
import PaymentRush from './PaymentRush'
import RibbonRider from './RibbonRider'
import StateStack from './StateStack'
import GlyphSlicer from './GlyphSlicer'
import LiquidPong from './LiquidPong'
import MoodMatch from './MoodMatch'
import OrbitBreaker from './OrbitBreaker'
import OrbitCatch from './OrbitCatch'
import OrbitGravity from './OrbitGravity'
import RaySays from './RaySays'
import StirFluid from './StirFluid'
import TunePulse from './TunePulse'
import '../philosophy-lab/philosophy-lab.css'
import './games.css'

/* Paddles top and bottom; you play from the bottom. */
function PongHorizontal() {
  return <LiquidPong orientation="stack" />
}

type Game = { id: string; name: string; group: string; Component: ComponentType }

const GAMES: Game[] = [
  { id: 'breaker', name: 'Orbit Breaker', group: 'Arcade', Component: OrbitBreaker },
  { id: 'catch', name: 'Orbit Catch', group: 'Toy', Component: OrbitCatch },
  { id: 'stir', name: 'Stir the Fluid', group: 'Toy', Component: StirFluid },
  { id: 'slicer', name: 'Glyph Slicer', group: 'Toy', Component: GlyphSlicer },
  { id: 'mood', name: 'Mood Match', group: 'On-brand', Component: MoodMatch },
  { id: 'pulse', name: 'Tune the Pulse', group: 'On-brand', Component: TunePulse },
  { id: 'build', name: 'Build the Glyph', group: 'On-brand', Component: BuildGlyph },
  { id: 'gravity', name: 'Orbit Gravity', group: 'Showpiece', Component: OrbitGravity },
  { id: 'says', name: 'Ray Says', group: 'Showpiece', Component: RaySays },
  { id: 'pong', name: 'Liquid Pong', group: 'Showpiece', Component: LiquidPong },
  { id: 'pong-h', name: 'Liquid Pong · Horizontal', group: 'Showpiece', Component: PongHorizontal },
  { id: 'runner', name: 'Flute Runner', group: 'Arcade', Component: FluteRunner },
  { id: 'ribbon', name: 'Ribbon Rider', group: 'Arcade', Component: RibbonRider },
  { id: 'caustic', name: 'Caustic Catch', group: 'On-brand', Component: CausticCatch },
  { id: 'stack', name: 'State Stack', group: 'On-brand', Component: StateStack },
  { id: 'snake', name: 'Orbit Snake', group: 'Arcade', Component: OrbitSnake },
  { id: 'memory', name: 'Glyph Memory', group: 'Toy', Component: GlyphMemory },
  { id: 'rush', name: 'Payment Rush', group: 'On-brand', Component: PaymentRush },
]

const read = () => {
  const v = new URLSearchParams(window.location.search).get('g')
  return GAMES.some((x) => x.id === v) ? v! : GAMES[0].id
}

/** /games — every end-of-page game idea, playable, behind one bar. */
export default function GamesLab({ onBack }: { onBack?: () => void }) {
  const [id, setId] = useState(read)
  const index = GAMES.findIndex((x) => x.id === id)
  const { Component, name } = GAMES[index]

  const select = (next: string) => {
    setId(next)
    const url = new URL(window.location.href)
    url.searchParams.set('g', next)
    window.history.replaceState({}, '', url)
  }

  /* [ and ] step through games (arrows and Space belong to the games). */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '[' && e.key !== ']') return
      const step = e.key === ']' ? 1 : -1
      select(GAMES[(index + step + GAMES.length) % GAMES.length].id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="plab games">
      <header className="plab-bar">
        <div className="plab-bar__row">
          {onBack && (
            <button type="button" className="plab-bar__back" onClick={onBack}>
              <ArrowLeft size={14} /> Back
            </button>
          )}
          <span className="plab-bar__title">End-of-page games · {name}</span>
          <span className="games__keys">[ ] to switch</span>
        </div>
        <nav className="plab-bar__tabs" aria-label="Games">
          {GAMES.map((x, i) => (
            <button
              key={x.id}
              type="button"
              className={`plab-tab ${x.id === id ? 'is-active' : ''}`}
              onClick={() => select(x.id)}
              aria-pressed={x.id === id}
            >
              <span className="plab-tab__num">{String(i).padStart(2, '0')}</span>
              {x.name}
              <span className={`plab-tab__group plab-tab__group--${x.group.toLowerCase().replace(/\W/g, '')}`}>
                {x.group}
              </span>
            </button>
          ))}
        </nav>
      </header>

      <main className="games__main">
        {/* Keyed so switching always starts a fresh game. */}
        <Component key={id} />
      </main>
    </div>
  )
}
