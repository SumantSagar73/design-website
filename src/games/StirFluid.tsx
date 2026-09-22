import { useRef, useState } from 'react'

import Stage from './Stage'
import { C, clamp, font, local, rand, readBest, saveBest, useCanvasLoop } from './kit'

const ID = 'stir-fluid'
const N = 650
const ROUND = 30
/* The hero atmosphere's dye colours. */
const DYES = ['#a8c6ff', '#ffceba', '#ffc4e2', '#c4ccfa', '#b8c8ff', '#8fd0f5']

/* Pre-rendered soft blobs, one per dye: far cheaper than a gradient per particle. */
const sprites = DYES.map((c) => {
  const s = document.createElement('canvas')
  s.width = s.height = 48
  const x = s.getContext('2d')!
  const g = x.createRadialGradient(24, 24, 0, 24, 24, 24)
  g.addColorStop(0, c)
  g.addColorStop(1, 'rgba(255,255,255,0)')
  x.fillStyle = g
  x.fillRect(0, 0, 48, 48)
  return s
})

type P = { x: number; y: number; vx: number; vy: number; c: number }

export default function StirFluid() {
  const [pct, setPct] = useState(0)
  const [left, setLeft] = useState(ROUND)
  const [best, setBest] = useState(() => readBest(ID))
  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready')
  const g = useRef({
    phase: 'ready' as 'ready' | 'play' | 'over',
    ps: [] as P[],
    ptr: { x: 0, y: 0, vx: 0, vy: 0, on: false },
    time: ROUND,
    pct: 0,
    size: { w: 0, h: 0 },
    hudTick: 0,
  })

  const seed = (w: number, h: number) => {
    /* Start the dye in four corner clouds, well outside the ring. */
    const clouds = [
      [0.12, 0.2],
      [0.88, 0.22],
      [0.14, 0.82],
      [0.86, 0.8],
    ]
    g.current.ps = Array.from({ length: N }, (_, i) => {
      const [cx, cy] = clouds[i % 4]
      return { x: cx * w + rand(-60, 60), y: cy * h + rand(-50, 50), vx: 0, vy: 0, c: i % DYES.length }
    })
  }

  const start = () => {
    const s = g.current
    seed(s.size.w, s.size.h)
    s.time = ROUND
    s.phase = 'play'
    setPhase('play')
  }

  const canvas = useCanvasLoop(({ ctx, w, h, dt, t }) => {
    const s = g.current
    if (s.size.w !== w || s.size.h !== h) {
      s.size = { w, h }
      if (!s.ps.length) seed(w, h)
    }
    const cx = w / 2
    const cy = h / 2
    const R = Math.min(w, h) * 0.27
    const T = Math.min(w, h) * 0.11

    if (s.phase === 'play') {
      s.time -= dt
      if (s.time <= 0) {
        s.time = 0
        s.phase = 'over'
        const final = Math.round(s.pct)
        setBest(saveBest(ID, final))
        setPhase('over')
      }
    }

    /* Physics: pointer drags nearby dye along its motion and swirls it. */
    const damp = Math.exp(-dt * 1.6)
    let inside = 0
    const p = s.ptr
    for (const q of s.ps) {
      if (p.on && s.phase === 'play') {
        const dx = q.x - p.x
        const dy = q.y - p.y
        const d2 = dx * dx + dy * dy
        const f = Math.exp(-d2 / (110 * 110))
        q.vx += (p.vx * 0.9 - dy * 1.2) * f * dt * 6
        q.vy += (p.vy * 0.9 + dx * 1.2) * f * dt * 6
      }
      /* faint ambient flow so it never looks frozen */
      q.vx += Math.sin(q.y * 0.012 + t * 0.7) * 6 * dt
      q.vy += Math.cos(q.x * 0.012 + t * 0.6) * 6 * dt
      q.vx *= damp
      q.vy *= damp
      q.x = clamp(q.x + q.vx * dt, 4, w - 4)
      q.y = clamp(q.y + q.vy * dt, 4, h - 4)
      const r = Math.hypot(q.x - cx, q.y - cy)
      if (Math.abs(r - R) < T / 2) inside++
    }
    p.vx *= Math.exp(-dt * 10)
    p.vy *= Math.exp(-dt * 10)
    s.pct = (inside / N) * 100

    s.hudTick -= dt
    if (s.hudTick <= 0) {
      s.hudTick = 0.12
      setPct(Math.round(s.pct))
      setLeft(Math.ceil(s.time))
    }

    /* target: the orbit ring as a soft band */
    ctx.save()
    ctx.lineWidth = T
    ctx.strokeStyle = `rgba(163,157,237,${0.06 + (s.pct / 100) * 0.12})`
    ctx.beginPath()
    ctx.arc(cx, cy, R, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([4, 8])
    ctx.lineWidth = 1.2
    ctx.strokeStyle = 'rgba(60,74,158,0.35)'
    for (const rr of [R - T / 2, R + T / 2]) {
      ctx.beginPath()
      ctx.arc(cx, cy, rr, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.restore()

    /* dye */
    ctx.save()
    ctx.globalCompositeOperation = 'multiply'
    ctx.globalAlpha = 0.55
    for (const q of s.ps) ctx.drawImage(sprites[q.c], q.x - 18, q.y - 18, 36, 36)
    ctx.restore()

    /* live percentage in the middle of the ring */
    ctx.fillStyle = C.ink
    ctx.font = font(500, R * 0.32)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.globalAlpha = 0.85
    ctx.fillText(`${Math.round(s.pct)}%`, cx, cy)
    ctx.globalAlpha = 1
  })

  const onMove = (e: React.PointerEvent) => {
    const q = local(e, e.currentTarget)
    const p = g.current.ptr
    if (p.on) {
      p.vx = (q.x - p.x) * 30
      p.vy = (q.y - p.y) * 30
    }
    p.x = q.x
    p.y = q.y
    p.on = true
  }

  return (
    <Stage
      score={`${pct}%`}
      best={`${best}%`}
      extra={[{ label: 'Time', value: `${left}s` }]}
      hint="Move the cursor to stir"
      overlay={
        phase === 'ready'
          ? { title: 'Stir the Fluid', body: 'Swirl the hero’s dye into the orbit ring. You have 30 seconds: how much can you gather inside the band?', action: 'Play', onAction: start }
          : phase === 'over'
            ? { title: `${pct}% in orbit`, body: pct >= best && pct > 0 ? 'New best.' : 'Keep it circling next time.', action: 'Play again', onAction: start }
            : null
      }
    >
      <canvas
        ref={canvas}
        className="game-canvas"
        onPointerMove={onMove}
        onPointerLeave={() => (g.current.ptr.on = false)}
      />
    </Stage>
  )
}
