import { useRef, useState } from 'react'

import Stage from './Stage'
import { C, chime, drawGlassRing, font, glow, local, readBest, saveBest, useCanvasLoop } from './kit'

const ID = 'orbit-gravity'
const LAUNCHES = 10
const HOLD = 5 // seconds in orbit to count as stable

type Planet = { x: number; y: number; vx: number; vy: number; age: number; stable: boolean; trail: { x: number; y: number }[]; hue: number }

export default function OrbitGravity() {
  const [stable, setStable] = useState(0)
  const [left, setLeft] = useState(LAUNCHES)
  const [best, setBest] = useState(() => readBest(ID))
  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready')
  const g = useRef({
    phase: 'ready' as 'ready' | 'play' | 'over',
    planets: [] as Planet[],
    aim: null as null | { x0: number; y0: number; x1: number; y1: number },
    left: LAUNCHES,
    stable: 0,
    msg: null as null | { text: string; life: number },
    size: { w: 1, h: 1 },
  })

  const start = () => {
    Object.assign(g.current, { phase: 'play', planets: [], aim: null, left: LAUNCHES, stable: 0, msg: null })
    setStable(0)
    setLeft(LAUNCHES)
    setPhase('play')
  }

  /* Gravity scaled to the stage so the same flick feels the same at any size. */
  const GM = () => {
    const m = Math.min(g.current.size.w, g.current.size.h) / 700
    return 1.8e7 * m * m * m
  }

  const step = (p: { x: number; y: number; vx: number; vy: number }, dt: number, cx: number, cy: number) => {
    const dx = cx - p.x
    const dy = cy - p.y
    const r2 = dx * dx + dy * dy
    const r = Math.sqrt(r2)
    const a = GM() / Math.max(r2, 400)
    p.vx += (dx / r) * a * dt
    p.vy += (dy / r) * a * dt
    p.x += p.vx * dt
    p.y += p.vy * dt
    return r
  }

  const finishCheck = () => {
    const s = g.current
    if (s.left <= 0 && s.planets.every((p) => p.stable)) {
      s.phase = 'over'
      setBest(saveBest(ID, s.stable))
      setPhase('over')
    }
  }

  const canvas = useCanvasLoop(({ ctx, w, h, dt, t }) => {
    const s = g.current
    s.size = { w, h }
    const cx = w / 2
    const cy = h / 2
    const starR = Math.min(w, h) * 0.045

    /* star: warm core in the hero palette */
    glow(ctx, cx, cy, starR * 7, 'rgba(255,206,186,0.55)')
    glow(ctx, cx, cy, starR * 4, 'rgba(255,196,226,0.6)')
    glow(ctx, cx, cy, starR * 2.2, 'rgba(163,157,237,0.7)')
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(cx, cy, starR * (1 + Math.sin(t * 2) * 0.04), 0, Math.PI * 2)
    ctx.fill()

    /* substeps keep close passes stable */
    const sub = 4
    for (let i = s.planets.length - 1; i >= 0; i--) {
      const p = s.planets[i]
      let r = 0
      for (let k = 0; k < sub; k++) r = step(p, dt / sub, cx, cy)
      p.age += dt
      p.trail.push({ x: p.x, y: p.y })
      if (p.trail.length > (p.stable ? 90 : 50)) p.trail.shift()
      const out = p.x < -w * 0.4 || p.x > w * 1.4 || p.y < -h * 0.4 || p.y > h * 1.4
      if (r < starR || out) {
        s.planets.splice(i, 1)
        s.msg = { text: r < starR ? 'Burned up' : 'Lost to space', life: 1.4 }
        chime([220], 0.04, 0.5)
        finishCheck()
        continue
      }
      if (!p.stable && p.age >= HOLD) {
        p.stable = true
        s.stable++
        setStable(s.stable)
        s.msg = { text: 'Stable orbit', life: 1.4 }
        chime([528, 660, 792], 0.06, 1.2)
        finishCheck()
      }
    }

    /* trails + planets */
    for (const p of s.planets) {
      ctx.save()
      ctx.lineCap = 'round'
      for (let k = 1; k < p.trail.length; k++) {
        ctx.globalAlpha = (k / p.trail.length) * (p.stable ? 0.5 : 0.35)
        ctx.strokeStyle = p.stable ? '#7f82de' : C.ink3
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(p.trail[k - 1].x, p.trail[k - 1].y)
        ctx.lineTo(p.trail[k].x, p.trail[k].y)
        ctx.stroke()
      }
      ctx.restore()
      const R = Math.min(w, h) * 0.022
      if (p.stable) glow(ctx, p.x, p.y, R * 3, 'rgba(127,130,222,0.35)')
      drawGlassRing(ctx, p.x, p.y, R, { tilt: p.hue, width: R * 0.5 })
      if (!p.stable) {
        /* progress arc toward "stable" */
        ctx.strokeStyle = 'rgba(60,74,158,0.6)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(p.x, p.y, R * 1.9, -Math.PI / 2, -Math.PI / 2 + (p.age / HOLD) * Math.PI * 2)
        ctx.stroke()
      }
    }

    /* aiming: slingshot line and a predicted path */
    if (s.aim) {
      const { x0, y0, x1, y1 } = s.aim
      const vx = (x0 - x1) * 2.2
      const vy = (y0 - y1) * 2.2
      ctx.save()
      ctx.strokeStyle = 'rgba(60,74,158,0.5)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(x0, y0)
      ctx.lineTo(x1, y1)
      ctx.stroke()
      const ghost = { x: x0, y: y0, vx, vy }
      ctx.fillStyle = 'rgba(60,74,158,0.45)'
      for (let k = 0; k < 90; k++) {
        const r = step(ghost, 1 / 60, cx, cy)
        if (r < starR) break
        if (k % 3 === 0) {
          ctx.beginPath()
          ctx.arc(ghost.x, ghost.y, 1.6, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.restore()
      drawGlassRing(ctx, x0, y0, Math.min(w, h) * 0.022, { alpha: 0.8 })
    }

    if (s.msg) {
      s.msg.life -= dt
      ctx.globalAlpha = Math.max(0, Math.min(1, s.msg.life))
      ctx.fillStyle = C.ink2
      ctx.font = font(500, 15)
      ctx.textAlign = 'center'
      ctx.fillText(s.msg.text, cx, h - 28)
      ctx.globalAlpha = 1
      if (s.msg.life <= 0) s.msg = null
    }
  })

  return (
    <Stage
      score={stable}
      best={best}
      extra={[{ label: 'Launches', value: left }]}
      hint="Drag back and release to fling"
      overlay={
        phase === 'ready'
          ? { title: 'Orbit Gravity', body: 'Pull back and release to fling a planet. Keep it circling for 5 seconds and it joins your system for good. Ten launches.', action: 'Play', onAction: start }
          : phase === 'over'
            ? { title: `${stable} in orbit`, body: stable >= best && stable > 0 ? 'New best system.' : 'Gravity is patient. Try again.', action: 'Play again', onAction: start }
            : null
      }
    >
      <canvas
        ref={canvas}
        className="game-canvas"
        onPointerDown={(e) => {
          const s = g.current
          if (s.phase !== 'play' || s.left <= 0) return
          const q = local(e, e.currentTarget)
          s.aim = { x0: q.x, y0: q.y, x1: q.x, y1: q.y }
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          const s = g.current
          if (!s.aim) return
          const q = local(e, e.currentTarget)
          s.aim.x1 = q.x
          s.aim.y1 = q.y
        }}
        onPointerUp={() => {
          const s = g.current
          if (!s.aim) return
          const { x0, y0, x1, y1 } = s.aim
          s.aim = null
          if (Math.hypot(x1 - x0, y1 - y0) < 6) return
          s.planets.push({ x: x0, y: y0, vx: (x0 - x1) * 2.2, vy: (y0 - y1) * 2.2, age: 0, stable: false, trail: [], hue: Math.random() * 1.2 - 0.6 })
          s.left--
          setLeft(s.left)
          chime([432], 0.03, 0.3)
        }}
      />
    </Stage>
  )
}
