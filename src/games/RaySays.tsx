import { useEffect, useRef, useState } from 'react'

import Stage from './Stage'
import { STATES, STATE_KEYS, chime, readBest, saveBest } from './kit'

const ID = 'ray-says'
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

function RayMark({ spin }: { spin: boolean }) {
  return (
    <svg className={`says__mark ${spin ? 'is-spin' : ''}`} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="says-ray" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1fd79a" />
          <stop offset="100%" stopColor="#3be3cf" />
        </linearGradient>
      </defs>
      <g fill="url(#says-ray)">
        <path d="M12 0.5 L17 6.2 L12 12 L7 6.2 Z" />
        <path d="M23.5 12 L17.8 17 L12 12 L17.8 7 Z" />
        <path d="M12 23.5 L7 17.8 L12 12 L17 17.8 Z" />
        <path d="M0.5 12 L6.2 7 L12 12 L6.2 17 Z" />
      </g>
    </svg>
  )
}

export default function RaySays() {
  const [phase, setPhase] = useState<'ready' | 'show' | 'input' | 'over'>('ready')
  const [seq, setSeq] = useState<number[]>([])
  const [lit, setLit] = useState<number | null>(null)
  const [pos, setPos] = useState(0)
  const [best, setBest] = useState(() => readBest(ID))
  const [line, setLine] = useState('Watch me.')
  const alive = useRef(true)
  useEffect(() => () => void (alive.current = false), [])

  const flash = async (i: number, ms: number) => {
    setLit(i)
    chime([STATES[STATE_KEYS[i]].chord[0], STATES[STATE_KEYS[i]].chord[1]], 0.06, ms / 1000 + 0.3)
    await wait(ms)
    setLit(null)
  }

  const play = async (next: number[]) => {
    setPhase('show')
    setLine('Watch me.')
    await wait(650)
    const on = Math.max(220, 520 - next.length * 22)
    for (const i of next) {
      if (!alive.current) return
      await flash(i, on)
      await wait(on * 0.35)
    }
    setPos(0)
    setPhase('input')
    setLine('Your turn.')
  }

  const start = () => {
    const first = [Math.floor(Math.random() * 4)]
    setSeq(first)
    void play(first)
  }

  const press = async (i: number) => {
    if (phase !== 'input') return
    void flash(i, 180)
    if (seq[pos] !== i) {
      chime([220, 233], 0.06, 0.6)
      setBest(saveBest(ID, seq.length - 1))
      setLine(`It was ${STATE_KEYS[seq[pos]]}.`)
      setPhase('over')
      return
    }
    if (pos + 1 === seq.length) {
      setLine(['Nice.', 'In sync.', 'Keep going.', 'Sharp.'][seq.length % 4])
      const next = [...seq, Math.floor(Math.random() * 4)]
      setSeq(next)
      await wait(420)
      void play(next)
    } else {
      setPos(pos + 1)
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const i = ['1', '2', '3', '4'].indexOf(e.key)
      if (i >= 0) void press(i)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const score = Math.max(0, phase === 'over' ? seq.length - 1 : seq.length - (phase === 'input' || phase === 'show' ? 1 : 0))

  return (
    <Stage
      score={score}
      best={best}
      extra={[{ label: 'Length', value: seq.length }]}
      hint="Repeat the sequence · keys 1–4"
      overlay={
        phase === 'ready'
          ? { title: 'Ray Says', body: 'Ray lights the four states in a sequence. Repeat it. Every round adds one more — and speeds up.', action: 'Play', onAction: start }
          : phase === 'over'
            ? { title: `${score} in a row`, body: `${line}${score >= best && score > 0 ? ' New best.' : ''}`, action: 'Play again', onAction: start }
            : null
      }
    >
      <div className="says">
        <div className="says__pads">
          {STATE_KEYS.map((k, i) => (
            <button
              key={k}
              type="button"
              className={`says__pad says__pad--${i} ${lit === i ? 'is-lit' : ''}`}
              style={{ ['--c' as string]: STATES[k].color, ['--soft' as string]: STATES[k].soft }}
              onPointerDown={() => void press(i)}
              disabled={phase !== 'input'}
              aria-label={k}
            >
              <span className="says__label">
                <span className="says__key">{i + 1}</span>
                {k}
              </span>
            </button>
          ))}
          <div className="says__core">
            <RayMark spin={phase === 'show'} />
            <span className="says__line">{line}</span>
          </div>
        </div>
      </div>
    </Stage>
  )
}
