import { useEffect, useRef, useState } from 'react'

import Stage from './Stage'
import { C, chime, drawRayMark, font, glow, local, readBest, saveBest, useCanvasLoop } from './kit'

const ID = 'orbit-snake'
const SPACING = 5 // path samples (~2px each) between body segments
const START_LEN = 14 // segments

type Pt = { x: number; y: number }

export default function OrbitSnake() {
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(() => readBest(ID))
  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready')
  const g = useRef({
    phase: 'ready' as 'ready' | 'play' | 'over',
    head: { x: 0, y: 0 } as Pt,
    dir: -Math.PI / 2,
    path: [] as Pt[], // head history, newest first
    len: START_LEN,
    food: { x: 0, y: 0 } as Pt,
    eaten: 0,
    ptr: null as Pt | null,
    keys: { l: false, r: false },
    size: { w: 1, h: 1 },
    pulse: 0,
  })

  const arena = () => {
    const s = g.current
    const { w, h } = s.size
    const base = Math.min(w, h) * 0.42
    /* the orbit tightens as the snake grows */
    return { cx: w / 2, cy: h / 2 + 10, r: base * (1 - Math.min(0.35, s.eaten * 0.014)) }
  }

  const placeFood = () => {
    const s = g.current
    const a = arena()
    for (let k = 0; k < 40; k++) {
      const ang = Math.random() * Math.PI * 2
      const rr = Math.sqrt(Math.random()) * (a.r - 28)
      const p = { x: a.cx + Math.cos(ang) * rr, y: a.cy + Math.sin(ang) * rr }
      if (!s.path.some((q, i) => i % 3 === 0 && Math.hypot(q.x - p.x, q.y - p.y) < 20)) {
        s.food = p
        return
      }
    }
  }

  const start = () => {
    const s = g.current
    const a = arena()
    s.head = { x: a.cx, y: a.cy + a.r * 0.4 }
    s.dir = -Math.PI / 2
    s.path = Array.from({ length: START_LEN * SPACING }, (_, i) => ({ x: s.head.x, y: s.head.y + i }))
    Object.assign(s, { phase: 'play', len: START_LEN, eaten: 0, ptr: null })
    placeFood()
    setScore(0)
    setPhase('play')
  }

  const die = () => {
    const s = g.current
    s.phase = 'over'
    chime([220, 233], 0.06, 0.6)
    setBest(saveBest(ID, s.eaten))
    setPhase('over')
  }

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft') g.current.keys.l = true
      if (e.code === 'ArrowRight') g.current.keys.r = true
    }
    const up = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft') g.current.keys.l = false
      if (e.code === 'ArrowRight') g.current.keys.r = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  const canvas = useCanvasLoop(({ ctx, w, h, dt, t }) => {
    const s = g.current
    s.size = { w, h }
    const a = arena()
    s.pulse = Math.max(0, s.pulse - dt * 2)

    if (s.phase === 'play') {
      /* steer: toward the pointer, or with the arrow keys; turn rate capped */
      const turn = 3.4 * dt
      if (s.keys.l || s.keys.r) {
        s.dir += (s.keys.r ? 1 : 0) * turn - (s.keys.l ? 1 : 0) * turn
      } else if (s.ptr) {
        const want = Math.atan2(s.ptr.y - s.head.y, s.ptr.x - s.head.x)
        const d = Math.atan2(Math.sin(want - s.dir), Math.cos(want - s.dir))
        if (Math.hypot(s.ptr.x - s.head.x, s.ptr.y - s.head.y) > 12) s.dir += Math.max(-turn, Math.min(turn, d))
      }
      const speed = Math.min(w, h) * (0.26 + s.eaten * 0.004)
      const steps = Math.max(1, Math.round((speed * dt) / 2))
      for (let k = 0; k < steps; k++) {
        s.head = { x: s.head.x + (Math.cos(s.dir) * speed * dt) / steps, y: s.head.y + (Math.sin(s.dir) * speed * dt) / steps }
        s.path.unshift({ ...s.head })
      }
      if (s.path.length > s.len * SPACING + 2) s.path.length = s.len * SPACING + 2

      if (Math.hypot(s.head.x - a.cx, s.head.y - a.cy) > a.r - 7) die()
      /* self: skip the neck so tight turns don't count */
      for (let i = SPACING * 6; i < s.path.length; i += 3) {
        const q = s.path[i]
        if (Math.hypot(q.x - s.head.x, q.y - s.head.y) < 7) {
          die()
          break
        }
      }
      if (s.phase === 'play' && Math.hypot(s.food.x - s.head.x, s.food.y - s.head.y) < 18) {
        s.eaten++
        s.len += 4
        s.pulse = 1
        setScore(s.eaten)
        chime([528 + (s.eaten % 8) * 44, 792 + (s.eaten % 8) * 44], 0.05, 0.5)
        placeFood()
      }
    }

    /* arena: the orbit ring, breathing when you eat */
    glow(ctx, a.cx, a.cy, a.r * 1.1, 'rgba(163,157,237,0.12)')
    ctx.save()
    ctx.lineWidth = 6 + s.pulse * 4
    const rg = ctx.createLinearGradient(a.cx - a.r, a.cy - a.r, a.cx + a.r, a.cy + a.r)
    rg.addColorStop(0, 'rgba(60,74,158,0.75)')
    rg.addColorStop(0.5, 'rgba(127,130,222,0.7)')
    rg.addColorStop(1, 'rgba(255,196,226,0.7)')
    ctx.strokeStyle = rg
    ctx.shadowColor = 'rgba(127,130,222,0.35)'
    ctx.shadowBlur = 18
    ctx.beginPath()
    ctx.arc(a.cx, a.cy, a.r, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()

    /* food: Ray's mark, slowly turning */
    if (s.phase !== 'ready') {
      glow(ctx, s.food.x, s.food.y, 26, 'rgba(31,215,154,0.3)')
      drawRayMark(ctx, s.food.x, s.food.y, 20, t * 1.5)
    }

    /* body: segments along the path, fading from ink at the head to lavender */
    const n = Math.floor(s.path.length / SPACING)
    for (let i = n - 1; i >= 0; i--) {
      const q = s.path[i * SPACING]
      if (!q) continue
      const f = i / Math.max(1, n - 1)
      const r = 7.5 - f * 3
      ctx.fillStyle = i === 0 ? C.ink : `rgba(${Math.round(60 + f * 103)}, ${Math.round(74 + f * 83)}, ${Math.round(158 + f * 79)}, ${1 - f * 0.4})`
      ctx.beginPath()
      ctx.arc(q.x, q.y, r, 0, Math.PI * 2)
      ctx.fill()
    }
    if (s.path.length) {
      /* eyes */
      const hx = s.head.x
      const hy = s.head.y
      ctx.fillStyle = '#fff'
      for (const side of [-1, 1]) {
        ctx.beginPath()
        ctx.arc(hx + Math.cos(s.dir + side * 0.6) * 4, hy + Math.sin(s.dir + side * 0.6) * 4, 1.8, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    ctx.fillStyle = C.ink3
    ctx.font = font(500, 12)
    ctx.textAlign = 'center'
    ctx.fillText(`Orbit radius ${Math.round((a.r / (Math.min(w, h) * 0.42)) * 100)}%`, a.cx, a.cy + a.r + 24)
  })

  return (
    <Stage
      score={score}
      best={best}
      hint="Steer with the pointer · or ← →"
      overlay={
        phase === 'ready'
          ? { title: 'Orbit Snake', body: 'Snake, inside the orbit. Eat Ray’s marks to grow — and every bite tightens the ring. Don’t touch the edge or yourself.', action: 'Play', onAction: start }
          : phase === 'over'
            ? { title: `${score} eaten`, body: score >= best && score > 0 ? 'New best.' : 'The orbit closed in.', action: 'Play again', onAction: start }
            : null
      }
    >
      <canvas
        ref={canvas}
        className="game-canvas"
        onPointerMove={(e) => (g.current.ptr = local(e, e.currentTarget))}
        onPointerLeave={() => (g.current.ptr = null)}
      />
    </Stage>
  )
}
