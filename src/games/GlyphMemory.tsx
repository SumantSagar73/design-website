import { useEffect, useRef, useState, type ReactNode } from 'react'

import Stage from './Stage'
import { STATES, chime, readBest, saveBest } from './kit'
import { GLYPH } from '../components/glyphShape'

const ID = 'glyph-memory'

/* The eight pieces of the design system, each drawn small. */
const FACES: { id: string; name: string; art: ReactNode }[] = [
  {
    id: 'glyph',
    name: 'Glyph',
    art: (
      <svg viewBox="180 110 440 490" className="mem__art">
        <path d={GLYPH} fill="#2a52dc" />
        {[225, 280, 335, 390, 445].map((x) => (
          <line key={x} x1={x} y1={640} x2={x + 129} y2={100} stroke="#d6e4ff" strokeWidth={8} />
        ))}
      </svg>
    ),
  },
  {
    id: 'ring',
    name: 'Orbit ring',
    art: (
      <svg viewBox="0 0 100 100" className="mem__art">
        <defs>
          <linearGradient id="mem-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a39ded" />
            <stop offset="50%" stopColor="#8fd0f5" />
            <stop offset="100%" stopColor="#ffceba" />
          </linearGradient>
        </defs>
        <ellipse cx="50" cy="50" rx="38" ry="22" transform="rotate(-18 50 50)" fill="none" stroke="url(#mem-ring)" strokeWidth="9" />
      </svg>
    ),
  },
  {
    id: 'ray',
    name: 'Ray',
    art: (
      <svg viewBox="0 0 24 24" className="mem__art mem__art--sm">
        <g fill="#1fd79a">
          <path d="M12 0.5 L17 6.2 L12 12 L7 6.2 Z" />
          <path d="M23.5 12 L17.8 17 L12 12 L17.8 7 Z" />
          <path d="M12 23.5 L7 17.8 L12 12 L17 17.8 Z" />
          <path d="M0.5 12 L6.2 7 L12 12 L6.2 17 Z" />
        </g>
      </svg>
    ),
  },
  {
    id: 'flute',
    name: 'Flutes',
    art: (
      <svg viewBox="0 0 100 80" className="mem__art">
        <rect x="8" y="10" width="84" height="46" rx="12" fill="#fff" stroke="#dfe3ea" strokeWidth="2" />
        <path d="M22 56 L22 70 L36 56 Z" fill="#fff" stroke="#dfe3ea" strokeWidth="2" strokeLinejoin="round" />
        <rect x="20" y="24" width="52" height="6" rx="3" fill="#cfd5df" />
        <rect x="20" y="36" width="34" height="6" rx="3" fill="#e2e6ec" />
      </svg>
    ),
  },
  ...(['Calm', 'Active', 'Alert', 'Resolve'] as const).map((k) => ({
    id: k.toLowerCase(),
    name: k,
    art: (
      <span className="mem__swatch" style={{ ['--c' as string]: STATES[k].color, ['--soft' as string]: STATES[k].soft }}>
        <span />
        <span />
        <span />
      </span>
    ),
  })),
]

type Card = { key: number; face: number; open: boolean; done: boolean }

const deal = (): Card[] => {
  const faces = [...FACES.keys(), ...FACES.keys()]
  for (let i = faces.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[faces[i], faces[j]] = [faces[j], faces[i]]
  }
  return faces.map((face, key) => ({ key, face, open: false, done: false }))
}

export default function GlyphMemory() {
  const [cards, setCards] = useState(deal)
  const [moves, setMoves] = useState(0)
  const [secs, setSecs] = useState(0)
  const [best, setBest] = useState(() => readBest(ID))
  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready')
  const [score, setScore] = useState(0)
  const busy = useRef(false)

  useEffect(() => {
    if (phase !== 'play') return
    const id = window.setInterval(() => setSecs((x) => x + 1), 1000)
    return () => window.clearInterval(id)
  }, [phase])

  const start = () => {
    setCards(deal())
    setMoves(0)
    setSecs(0)
    setPhase('play')
  }

  const flip = (i: number) => {
    if (phase !== 'play' || busy.current) return
    const c = cards[i]
    if (c.open || c.done) return
    const next = cards.map((x, j) => (j === i ? { ...x, open: true } : x))
    const open = next.filter((x) => x.open && !x.done)
    chime([528], 0.02, 0.15)
    setCards(next)
    if (open.length < 2) return
    busy.current = true
    setMoves((m) => m + 1)
    const [a, b] = open
    const match = a.face === b.face
    window.setTimeout(() => {
      const settled = next.map((x) => (x.open && !x.done ? (match ? { ...x, done: true } : { ...x, open: false }) : x))
      setCards(settled)
      busy.current = false
      if (match) {
        const k = FACES[a.face].name as keyof typeof STATES
        chime(STATES[k]?.chord ?? [660, 880], 0.05, 0.8)
        if (settled.every((x) => x.done)) {
          /* fewer moves and less time score higher; 8 moves is perfect */
          const pts = Math.max(10, 200 - (moves + 1 - 8) * 8 - secs)
          setScore(pts)
          setBest(saveBest(ID, pts))
          setPhase('over')
        }
      }
    }, match ? 380 : 760)
  }

  return (
    <Stage
      score={phase === 'over' ? score : undefined}
      best={best}
      extra={[
        { label: 'Moves', value: moves },
        { label: 'Time', value: `${secs}s` },
      ]}
      hint="Find the eight pairs"
      overlay={
        phase === 'ready'
          ? { title: 'Glyph Memory', body: 'Sixteen cards, eight pieces of the design system: the glyph, the orbit ring, Ray, the Flutes and the four states. Match them in as few moves as you can.', action: 'Deal', onAction: start }
          : phase === 'over'
            ? { title: `${score} points`, body: `${moves} moves in ${secs}s.${score >= best ? ' New best.' : ''}`, action: 'Deal again', onAction: start }
            : null
      }
    >
      <div className="mem">
        <div className="mem__grid">
          {cards.map((c, i) => (
            <button
              key={c.key}
              type="button"
              className={`mem__card ${c.open || c.done ? 'is-open' : ''} ${c.done ? 'is-done' : ''}`}
              onClick={() => flip(i)}
              aria-label={c.open || c.done ? FACES[c.face].name : 'Hidden card'}
            >
              <span className="mem__inner">
                <span className="mem__back" aria-hidden="true">
                  <span className="mem__back-ring" />
                </span>
                <span className="mem__front">
                  {FACES[c.face].art}
                  <span className="mem__name">{FACES[c.face].name}</span>
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </Stage>
  )
}
