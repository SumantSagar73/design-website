import { useEffect, useRef, useState } from 'react'

import Stage from './Stage'
import { C, STATES, STATE_KEYS, chime, font, glow, readBest, rgba, saveBest, useCanvasLoop, type StateKey } from './kit'

const ID = 'tune-pulse'
const BEATS_PER_STATE = 8
/* Each state's heartbeat, in beats per minute. */
const BPM: Record<StateKey, number> = { Calm: 56, Active: 92, Attention: 128, Success: 74 }
const TRAVEL = 1.25 // seconds from centre to the target ring
const PERFECT = 0.06
const GOOD = 0.13

type Pulse = { hitAt: number; state: StateKey; judged: boolean }
type Pop = { text: string; life: number; color: string }

export default function TunePulse() {
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [best, setBest] = useState(() => readBest(ID))
  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready')
  const [stateName, setStateName] = useState<StateKey>('Calm')
  const g = useRef({
    phase: 'ready' as 'ready' | 'play' | 'over',
    clock: 0,
    pulses: [] as Pulse[],
    pops: [] as Pop[],
    score: 0,
    combo: 0,
    hits: 0,
    total: 0,
    flash: 0,
  })

  /* Lay out the whole song up front: 8 beats per state, in order. */
  const start = () => {
    const pulses: Pulse[] = []
    let at = 1.6
    for (const k of STATE_KEYS) {
      const gap = 60 / BPM[k]
      for (let b = 0; b < BEATS_PER_STATE; b++) {
        pulses.push({ hitAt: at, state: k, judged: false })
        at += gap
      }
      at += 0.6
    }
    Object.assign(g.current, { phase: 'play', clock: 0, pulses, pops: [], score: 0, combo: 0, hits: 0, total: pulses.length })
    setScore(0)
    setCombo(0)
    setStateName('Calm')
    setPhase('play')
    chime([432], 0.02, 0.2) // unlocks audio on the click
  }

  const judge = (text: string, color: string) => g.current.pops.push({ text, life: 1, color })

  const tap = () => {
    const s = g.current
    if (s.phase !== 'play') return
    const open = s.pulses.filter((p) => !p.judged)
    if (!open.length) return
    const p = open.reduce((a, b) => (Math.abs(b.hitAt - s.clock) < Math.abs(a.hitAt - s.clock) ? b : a))
    const err = Math.abs(p.hitAt - s.clock)
    if (err > GOOD * 2) return // nowhere near a beat: ignore
    p.judged = true
    if (err <= GOOD) {
      const perfect = err <= PERFECT
      s.combo++
      s.hits++
      s.score += (perfect ? 3 : 1) * (1 + Math.floor(s.combo / 8))
      s.flash = 1
      judge(perfect ? 'Perfect' : 'Good', STATES[p.state].color)
      chime([STATES[p.state].chord[s.combo % STATES[p.state].chord.length]], 0.06, 0.6)
    } else {
      s.combo = 0
      judge('Off beat', '#e0457b')
    }
    setScore(s.score)
    setCombo(s.combo)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        tap()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const canvas = useCanvasLoop(({ ctx, w, h, dt }) => {
    const s = g.current
    const cx = w / 2
    const cy = h / 2
    const Rt = Math.min(w, h) * 0.3
    if (s.phase === 'play') s.clock += dt
    s.flash = Math.max(0, s.flash - dt * 3)

    /* missed beats */
    for (const p of s.pulses) {
      if (!p.judged && s.clock - p.hitAt > GOOD) {
        p.judged = true
        s.combo = 0
        setCombo(0)
        judge('Miss', C.ink3)
      }
    }
    const current = s.pulses.find((p) => p.hitAt >= s.clock - 0.2)?.state ?? 'Success'
    if (current !== stateRef.current) {
      stateRef.current = current
      setStateName(current)
    }
    if (s.phase === 'play' && s.pulses.length && s.pulses.every((p) => p.judged)) {
      s.phase = 'over'
      setBest(saveBest(ID, s.score))
      setPhase('over')
    }
    const st = STATES[current]

    /* target ring */
    glow(ctx, cx, cy, Rt * 1.3, rgba(st.color, 0.18), 0.6 + s.flash * 0.4)
    ctx.lineWidth = 3 + s.flash * 3
    ctx.strokeStyle = rgba(st.color, 0.55 + s.flash * 0.4)
    ctx.beginPath()
    ctx.arc(cx, cy, Rt, 0, Math.PI * 2)
    ctx.stroke()

    /* incoming pulses: born at the centre TRAVEL seconds before their beat */
    for (const p of s.pulses) {
      const age = s.clock - (p.hitAt - TRAVEL)
      if (age < 0 || p.judged) continue
      const r = (age / TRAVEL) * Rt
      if (r > Rt * 1.3) continue
      const c = STATES[p.state].color
      ctx.lineWidth = 2
      ctx.strokeStyle = rgba(c, Math.min(1, age * 2) * 0.75)
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.stroke()
    }

    /* core: the state's name */
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = st.color
    ctx.font = font(500, Rt * 0.22)
    ctx.fillText(current, cx, cy - Rt * 0.06)
    ctx.fillStyle = C.ink3
    ctx.font = font(500, Math.max(12, Rt * 0.07))
    ctx.fillText(`${BPM[current]} bpm`, cx, cy + Rt * 0.14)

    /* judgement pops */
    for (let i = s.pops.length - 1; i >= 0; i--) {
      const p = s.pops[i]
      p.life -= dt * 1.6
      if (p.life <= 0) {
        s.pops.splice(i, 1)
        continue
      }
      ctx.globalAlpha = p.life
      ctx.fillStyle = p.color
      ctx.font = font(600, 18)
      ctx.fillText(p.text, cx, cy + Rt + 34 - (1 - p.life) * 18)
      ctx.globalAlpha = 1
    }
  })
  const stateRef = useRef<StateKey>('Calm')

  return (
    <Stage
      score={score}
      best={best}
      extra={[
        { label: 'Combo', value: combo },
        { label: 'State', value: stateName },
      ]}
      hint="Click or Space on the beat"
      overlay={
        phase === 'ready'
          ? { title: 'Tune the Pulse', body: 'Each RazorSense state has a heartbeat — Calm is slow, Attention races. Tap as each pulse meets the ring. Sound on.', action: 'Play', onAction: start }
          : phase === 'over'
            ? { title: `${score} points`, body: `${g.current.hits}/${g.current.total} beats in tune.${score >= best && score > 0 ? ' New best.' : ''}`, action: 'Play again', onAction: start }
            : null
      }
    >
      <canvas ref={canvas} className="game-canvas" onPointerDown={tap} />
    </Stage>
  )
}
