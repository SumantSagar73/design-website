import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

import Stage from './Stage'
import { C, chime, drawOrbital, font, local, rand, readBest, ribbonGradient, saveBest, useCanvasLoop } from './kit'

const ID = 'glyph-slicer'
const LIVES = 3
/* A clean cut runs along the orbital's own axis, before its spin. */
const STRIPE = 0

export type SlicerHandle = { start: () => void }
export type SlicerStats = { phase: 'ready' | 'play' | 'over'; score: number; best: number; lives: number }

type Props = {
  /** Drop the Stage card chrome — used by the footer, which frames it itself. */
  bare?: boolean
  onStats?: (s: SlicerStats) => void
}

type Glyph = { x: number; y: number; vx: number; vy: number; rot: number; vr: number; h: number; risen: boolean }
type Piece = { x: number; y: number; vx: number; vy: number; rot: number; vr: number; h: number; side: 1 | -1; cut: number; life: number }
type Pop = { x: number; y: number; text: string; life: number }

const segCircle = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number, r: number) => {
  const dx = bx - ax
  const dy = by - ay
  const l2 = dx * dx + dy * dy || 1
  const u = Math.max(0, Math.min(1, ((cx - ax) * dx + (cy - ay) * dy) / l2))
  const px = ax + u * dx - cx
  const py = ay + u * dy - cy
  return px * px + py * py <= r * r
}

const GlyphSlicer = forwardRef<SlicerHandle, Props>(function GlyphSlicer({ bare = false, onStats }, ref) {
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(LIVES)
  const [best, setBest] = useState(() => readBest(ID))
  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready')
  const g = useRef({
    phase: 'ready' as 'ready' | 'play' | 'over',
    glyphs: [] as Glyph[],
    pieces: [] as Piece[],
    pops: [] as Pop[],
    trail: [] as { x: number; y: number; t: number }[],
    down: false,
    spawn: 0,
    score: 0,
    lives: LIVES,
    time: 0,
  })

  const start = () => {
    Object.assign(g.current, { phase: 'play', glyphs: [], pieces: [], pops: [], trail: [], spawn: 0.4, score: 0, lives: LIVES, time: 0 })
    setScore(0)
    setLives(LIVES)
    setPhase('play')
  }

  const end = () => {
    const s = g.current
    s.phase = 'over'
    setBest(saveBest(ID, s.score))
    setPhase('over')
  }

  const canvas = useCanvasLoop(({ ctx, w, h, dt, t }) => {
    const s = g.current
    const G = h * 1.15 // gravity
    s.time += dt

    /* spawn: arcs from below, faster as time goes on */
    if (s.phase === 'play') {
      s.spawn -= dt
      if (s.spawn <= 0) {
        const count = Math.random() < Math.min(0.15 + s.time / 90, 0.5) ? 2 : 1
        for (let k = 0; k < count; k++) {
          const x = rand(w * 0.2, w * 0.8)
          s.glyphs.push({
            x,
            y: h + 60,
            vx: (w / 2 - x) * rand(0.35, 0.8),
            vy: -Math.sqrt(2 * G * h * rand(0.55, 0.85)),
            rot: rand(-0.6, 0.6),
            vr: rand(-1.4, 1.4),
            h: Math.min(w, h) * rand(0.13, 0.17),
            risen: false,
          })
        }
        s.spawn = Math.max(0.55, 1.35 - s.time / 60)
      }
    }

    /* swipe: cut anything the newest trail segment passes through */
    const tr = s.trail
    while (tr.length && s.time - tr[0].t > 0.14) tr.shift()
    if (tr.length >= 2 && s.phase === 'play') {
      const a = tr[tr.length - 2]
      const b = tr[tr.length - 1]
      for (let i = s.glyphs.length - 1; i >= 0; i--) {
        const q = s.glyphs[i]
        if (!segCircle(a.x, a.y, b.x, b.y, q.x, q.y, q.h * 0.42)) continue
        const swipe = Math.atan2(b.y - a.y, b.x - a.x)
        let diff = Math.abs(((swipe - (STRIPE + q.rot)) % Math.PI) + Math.PI) % Math.PI
        diff = Math.min(diff, Math.PI - diff)
        const clean = diff < 0.26
        const pts = clean ? 2 : 1
        s.score += pts
        setScore(s.score)
        s.pops.push({ x: q.x, y: q.y - q.h * 0.6, text: clean ? 'Clean +2' : '+1', life: 1 })
        chime(clean ? [660, 990] : [528], 0.05, 0.5)
        const nx = -Math.sin(swipe)
        const ny = Math.cos(swipe)
        for (const side of [1, -1] as const) {
          s.pieces.push({
            x: q.x, y: q.y, vx: q.vx + nx * 160 * side, vy: q.vy + ny * 160 * side,
            rot: q.rot, vr: q.vr + side * 2, h: q.h, side, cut: swipe - q.rot, life: 1.6,
          })
        }
        s.glyphs.splice(i, 1)
      }
    }

    /* glyph flight; a missed glyph costs a life */
    for (let i = s.glyphs.length - 1; i >= 0; i--) {
      const q = s.glyphs[i]
      q.vy += G * dt
      q.x += q.vx * dt
      q.y += q.vy * dt
      q.rot += q.vr * dt
      if (q.y < h) q.risen = true
      if (q.risen && q.y > h + q.h) {
        s.glyphs.splice(i, 1)
        if (s.phase === 'play') {
          s.lives--
          setLives(s.lives)
          chime([220], 0.05, 0.5)
          if (s.lives <= 0) end()
        }
      } else {
        drawOrbital(ctx, q.x, q.y, q.h, { rotate: q.rot })
      }
    }

    /* halves: each clipped to one side of the cut line */
    for (let i = s.pieces.length - 1; i >= 0; i--) {
      const p = s.pieces[i]
      p.vy += G * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.rot += p.vr * dt
      p.life -= dt
      if (p.life <= 0 || p.y > h + p.h * 2) {
        s.pieces.splice(i, 1)
        continue
      }
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.save()
      ctx.rotate(p.cut)
      ctx.beginPath()
      ctx.rect(-p.h * 2, p.side > 0 ? 0 : -p.h * 2, p.h * 4, p.h * 2)
      ctx.restore()
      ctx.clip()
      drawOrbital(ctx, 0, 0, p.h, { alpha: Math.min(1, p.life) })
      ctx.restore()
    }

    /* trail */
    if (tr.length >= 2) {
      ctx.save()
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = ribbonGradient(ctx, tr[0].x, tr[0].y, tr[tr.length - 1].x, tr[tr.length - 1].y)
      for (let k = 1; k < tr.length; k++) {
        ctx.lineWidth = 2 + (k / tr.length) * 7
        ctx.globalAlpha = k / tr.length
        ctx.beginPath()
        ctx.moveTo(tr[k - 1].x, tr[k - 1].y)
        ctx.lineTo(tr[k].x, tr[k].y)
        ctx.stroke()
      }
      ctx.restore()
    }

    /* score pops */
    ctx.textAlign = 'center'
    ctx.font = font(600, 15)
    for (let i = s.pops.length - 1; i >= 0; i--) {
      const p = s.pops[i]
      p.life -= dt * 1.2
      p.y -= 40 * dt
      if (p.life <= 0) {
        s.pops.splice(i, 1)
        continue
      }
      ctx.globalAlpha = p.life
      ctx.fillStyle = p.text.startsWith('Clean') ? C.indigo : C.ink2
      ctx.fillText(p.text, p.x, p.y)
    }
    ctx.globalAlpha = 1
    void t
  })

  const push = (e: React.PointerEvent) => {
    const q = local(e, e.currentTarget)
    g.current.trail.push({ ...q, t: g.current.time })
  }

  useImperativeHandle(ref, () => ({ start }), [])

  /* Held in a ref so an inline callback from the parent can't re-fire this. */
  const statsCb = useRef(onStats)
  useEffect(() => {
    statsCb.current = onStats
  }, [onStats])
  useEffect(() => {
    statsCb.current?.({ phase, score, best, lives })
  }, [phase, score, best, lives])

  const surface = (
    <canvas
      ref={canvas}
      className="game-canvas"
      onPointerDown={(e) => {
        g.current.down = true
        g.current.trail = []
        push(e)
      }}
      onPointerMove={(e) => g.current.down && push(e)}
      onPointerUp={() => (g.current.down = false)}
      onPointerLeave={() => (g.current.down = false)}
    />
  )

  if (bare) return <div className="slicer-bare">{surface}</div>

  return (
    <Stage
      score={score}
      best={best}
      extra={[{ label: 'Lives', value: '●'.repeat(Math.max(lives, 0)) + '○'.repeat(LIVES - Math.max(lives, 0)) }]}
      hint="Drag to slice · along the orbital's axis for ×2"
      overlay={
        phase === 'ready'
          ? { title: 'Orbit Slicer', body: 'Slice the orbitals before they fall. Cut along an orbital’s own axis for a clean ×2. Miss three and it’s over.', action: 'Play', onAction: start }
          : phase === 'over'
            ? { title: `${score} points`, body: score >= best && score > 0 ? 'New best.' : 'Three got away.', action: 'Play again', onAction: start }
            : null
      }
    >
      {surface}
    </Stage>
  )
})

export default GlyphSlicer
