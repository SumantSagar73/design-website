import { useEffect, useRef, useState } from 'react'

import Stage from './Stage'
import { C, chime, drawRayMark, glow, readBest, ribbonGradient, saveBest, useCanvasLoop } from './kit'

const ID = 'orbit-catch'

type Ring = { gap: number; half: number; speed: number }

/* Level n: more rings, faster spin, tighter gaps. */
function makeRings(level: number): Ring[] {
  const count = Math.min(1 + Math.floor(level / 2), 5)
  return Array.from({ length: count }, (_, i) => ({
    gap: Math.random() * Math.PI * 2,
    half: Math.max(0.24, 0.5 - level * 0.02 - i * 0.03),
    speed: (0.9 + level * 0.12 + i * 0.25) * (i % 2 ? -1 : 1),
  }))
}

const angleIn = (a: number, centre: number, half: number) => {
  const d = Math.atan2(Math.sin(a - centre), Math.cos(a - centre))
  return Math.abs(d) <= half
}

export default function OrbitCatch() {
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(() => readBest(ID))
  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready')
  const g = useRef({
    phase: 'ready' as 'ready' | 'play' | 'over',
    level: 0,
    rings: makeRings(0),
    dot: { d: 0, flying: false }, // d: distance travelled from launcher
    crossed: 0,
    flash: 0,
    fail: 0,
    pass: [] as number[],
    next: 0,
  })

  const start = () => {
    const s = g.current
    s.level = 0
    s.rings = makeRings(0)
    s.dot = { d: 0, flying: false }
    s.crossed = 0
    s.pass = []
    s.fail = 0
    s.phase = 'play'
    setScore(0)
    setPhase('play')
  }

  const fire = () => {
    const s = g.current
    if (s.phase !== 'play' || s.dot.flying || s.next > 0) return
    s.dot = { d: 0, flying: true }
    s.crossed = 0
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        fire()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const canvas = useCanvasLoop(({ ctx, w, h, dt, t }) => {
    const s = g.current
    const cx = w / 2
    const cy = h * 0.46
    const R = Math.min(w, h) * 0.34
    const radii = s.rings.map((_, i) => R * (1 - i * 0.18))
    const launchY = cy + R + Math.min(h * 0.2, 110)
    const travel = launchY - cy

    if (s.phase === 'play') s.rings.forEach((r) => (r.gap += r.speed * dt))
    s.flash = Math.max(0, s.flash - dt * 2.5)
    s.fail = Math.max(0, s.fail - dt * 2)

    /* Advance the dot; check each ring as it's crossed. The dot travels
       straight up, so it meets every ring at the bottom (angle +90°). */
    if (s.dot.flying) {
      s.dot.d += 1100 * dt
      const dist = travel - s.dot.d
      while (s.crossed < radii.length && dist <= radii[s.crossed]) {
        const ring = s.rings[s.crossed]
        if (angleIn(Math.PI / 2, ring.gap, ring.half)) {
          s.pass.push(s.crossed)
          chime([528 + s.crossed * 90], 0.05, 0.4)
          s.crossed++
        } else {
          s.dot.flying = false
          s.fail = 1
          s.phase = 'over'
          chime([220, 233], 0.06, 0.6)
          setBest(saveBest(ID, s.level))
          setPhase('over')
          break
        }
      }
      if (s.dot.flying && dist <= 0) {
        s.dot.flying = false
        s.level++
        s.flash = 1
        setScore(s.level)
        chime([528, 660, 792, 1056], 0.07, 1.4)
        s.next = 0.5
      }
    }
    if (s.next > 0) {
      s.next -= dt
      if (s.next <= 0) {
        s.rings = makeRings(s.level)
        s.pass = []
        s.dot = { d: 0, flying: false }
      }
    }

    /* guide */
    ctx.save()
    ctx.setLineDash([3, 7])
    ctx.strokeStyle = C.line
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(cx, launchY)
    ctx.lineTo(cx, cy)
    ctx.stroke()
    ctx.restore()

    /* core */
    glow(ctx, cx, cy, R * 0.5, 'rgba(163,157,237,0.35)', 0.6 + s.flash * 0.4)
    drawRayMark(ctx, cx, cy, R * 0.22 * (1 + s.flash * 0.25), t * 0.6)

    /* rings */
    s.rings.forEach((ring, i) => {
      const r = radii[i]
      const lit = s.pass.includes(i)
      ctx.save()
      ctx.lineCap = 'round'
      ctx.lineWidth = Math.max(6, R * 0.05)
      ctx.strokeStyle = lit ? 'rgba(43,187,201,0.9)' : ribbonGradient(ctx, cx - r, cy - r, cx + r, cy + r)
      ctx.shadowColor = lit ? 'rgba(43,187,201,0.5)' : 'rgba(127,130,222,0.35)'
      ctx.shadowBlur = 16
      ctx.beginPath()
      ctx.arc(cx, cy, r, ring.gap + ring.half, ring.gap - ring.half + Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    })

    /* crossing marker under the rings */
    ctx.fillStyle = C.ink3
    radii.forEach((r) => {
      ctx.beginPath()
      ctx.arc(cx, cy + r, 2, 0, Math.PI * 2)
      ctx.fill()
    })

    /* dot */
    const dy = s.dot.flying ? launchY - s.dot.d : launchY
    const shake = s.fail > 0 ? Math.sin(t * 60) * 6 * s.fail : 0
    glow(ctx, cx + shake, dy, 22, s.fail > 0 ? 'rgba(224,69,123,0.5)' : 'rgba(60,74,158,0.35)')
    ctx.fillStyle = s.fail > 0 ? '#e0457b' : C.ink
    ctx.beginPath()
    ctx.arc(cx + shake, dy, 7, 0, Math.PI * 2)
    ctx.fill()
  })

  return (
    <Stage
      score={score}
      best={best}
      hint="Click or Space to launch"
      overlay={
        phase === 'ready'
          ? { title: 'Orbit Catch', body: 'Fire the dot through every gap to reach Ray at the core. Each catch adds speed and rings.', action: 'Play', onAction: start }
          : phase === 'over'
            ? { title: `Caught ${score}`, body: score >= best && score > 0 ? 'New best.' : 'The ring closed on you.', action: 'Play again', onAction: start }
            : null
      }
    >
      <canvas ref={canvas} className="game-canvas" onPointerDown={fire} />
    </Stage>
  )
}
