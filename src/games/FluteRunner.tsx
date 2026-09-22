import { useEffect, useRef, useState } from 'react'

import Stage from './Stage'
import { C, chime, drawGlyph, drawRayMark, font, rand, readBest, saveBest, useCanvasLoop } from './kit'

const ID = 'flute-runner'

/* Ray's chat bubbles are the obstacles; tall ones are stacked messages. */
type Bubble = { x: number; w: number; h: number; lift: number; lines: number }

export default function FluteRunner() {
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(() => readBest(ID))
  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready')
  const g = useRef({
    phase: 'ready' as 'ready' | 'play' | 'over',
    y: 0, // glyph height above ground (px)
    vy: 0,
    jumps: 0,
    speed: 0,
    dist: 0,
    spawn: 0,
    bubbles: [] as Bubble[],
    shown: 0,
  })

  const start = () => {
    Object.assign(g.current, { phase: 'play', y: 0, vy: 0, jumps: 0, speed: 0, dist: 0, spawn: 0.8, bubbles: [], shown: 0 })
    setScore(0)
    setPhase('play')
  }

  const jump = () => {
    const s = g.current
    if (s.phase !== 'play') return
    /* one jump from the ground plus one mid-air flutter */
    if (s.jumps < 2) {
      s.vy = s.jumps === 0 ? 720 : 560
      s.jumps++
      chime([s.jumps === 1 ? 528 : 660], 0.03, 0.2)
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault()
        jump()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const canvas = useCanvasLoop(({ ctx, w, h, dt, t }) => {
    const s = g.current
    const ground = h * 0.74
    const px = w * 0.16
    const gh = Math.min(64, h * 0.1) // glyph height
    const unit = h / 700

    if (s.phase === 'play') {
      s.speed = (360 + s.dist * 0.018) * unit
      s.dist += s.speed * dt
      /* jump physics in a 700px-tall reference frame, scaled on draw */
      s.vy -= 2100 * dt
      s.y = Math.max(0, s.y + s.vy * dt)
      if (s.y === 0) {
        s.vy = 0
        s.jumps = 0
      }
      s.spawn -= dt
      if (s.spawn <= 0) {
        const tall = Math.random() < Math.min(0.35, s.dist / 9000)
        const floating = !tall && Math.random() < 0.22
        s.bubbles.push({
          x: w + 40,
          w: rand(70, 120) * unit,
          h: (tall ? rand(84, 104) : rand(40, 54)) * unit,
          lift: floating ? rand(70, 90) * unit : 0,
          lines: tall ? 3 : 1,
        })
        s.spawn = rand(0.9, 1.6) * Math.max(0.55, 1 - s.dist / 20000)
      }
      const pts = Math.floor(s.dist / 40)
      if (pts !== s.shown) {
        s.shown = pts
        setScore(pts)
      }
    }

    /* backdrop: a slow parade of faint orbit rings */
    ctx.save()
    ctx.strokeStyle = 'rgba(127,130,222,0.12)'
    ctx.lineWidth = 2
    for (let k = 0; k < 5; k++) {
      const x = (((k * w) / 4 - s.dist * 0.15) % (w * 1.25)) + w * 1.25
      ctx.beginPath()
      ctx.ellipse((x % (w * 1.25)) - w * 0.1, ground * 0.45, 90, 32, -0.3, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.restore()

    /* ground: a hairline with a ribbon sheen */
    const gr = ctx.createLinearGradient(0, 0, w, 0)
    gr.addColorStop(0, 'rgba(60,74,158,0)')
    gr.addColorStop(0.3, 'rgba(60,74,158,0.35)')
    gr.addColorStop(0.7, 'rgba(163,157,237,0.35)')
    gr.addColorStop(1, 'rgba(163,157,237,0)')
    ctx.fillStyle = gr
    ctx.fillRect(0, ground, w, 2)
    ctx.fillStyle = C.line
    for (let x = -((s.dist * 0.9) % 40); x < w; x += 40) ctx.fillRect(x, ground + 12, 14, 1.5)

    /* bubbles */
    const gx0 = px - gh * 0.3
    const gx1 = px + gh * 0.3
    const gy1 = ground - s.y * unit
    const gy0 = gy1 - gh * 0.85
    for (let i = s.bubbles.length - 1; i >= 0; i--) {
      const b = s.bubbles[i]
      if (s.phase === 'play') b.x -= s.speed * dt
      if (b.x + b.w < -20) {
        s.bubbles.splice(i, 1)
        continue
      }
      const by1 = ground - b.lift
      const by0 = by1 - b.h
      ctx.save()
      ctx.shadowColor = 'rgba(25,42,86,0.14)'
      ctx.shadowBlur = 16
      ctx.shadowOffsetY = 6
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.roundRect(b.x, by0, b.w, b.h, [14, 14, 14, 4])
      ctx.fill()
      ctx.restore()
      ctx.strokeStyle = '#e6e9e4'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(b.x, by0, b.w, b.h, [14, 14, 14, 4])
      ctx.stroke()
      drawRayMark(ctx, b.x + 14, by0 + 14, 11)
      ctx.fillStyle = '#dfe3ea'
      for (let l = 0; l < b.lines; l++) {
        const ly = by0 + 26 + l * 22 * unit
        ctx.fillRect(b.x + 12, ly, (b.w - 24) * (l % 2 ? 0.6 : 0.85), 6 * unit)
      }
      /* collision (slightly forgiving box) */
      if (s.phase === 'play' && gx1 > b.x + 6 && gx0 < b.x + b.w - 6 && gy1 > by0 + 6 && gy0 < by1 - 4) {
        s.phase = 'over'
        chime([220, 233], 0.06, 0.6)
        setBest(saveBest(ID, s.shown))
        setPhase('over')
      }
    }

    /* the glyph, leaning into the run; squashes on landing */
    const air = s.y > 0
    const tilt = air ? -0.18 + Math.max(-0.3, Math.min(0.3, -s.vy / 3000)) : Math.sin(t * 18) * 0.04
    ctx.fillStyle = 'rgba(42,82,220,0.12)'
    ctx.beginPath()
    ctx.ellipse(px, ground + 3, gh * 0.4 * (1 - Math.min(0.6, s.y / 400)), 4, 0, 0, Math.PI * 2)
    ctx.fill()
    drawGlyph(ctx, px, gy1 - gh * 0.45, gh, { rotate: tilt })

    ctx.fillStyle = C.ink3
    ctx.font = font(500, 12)
    ctx.textAlign = 'right'
    ctx.fillText(`${Math.floor(s.dist / 40)} m`, w - 20, ground + 34)
  })

  return (
    <Stage
      score={score}
      best={best}
      hint="Click or Space to jump · twice to flutter"
      overlay={
        phase === 'ready'
          ? { title: 'Flute Runner', body: 'The glyph runs; Ray keeps talking. Hop the chat bubbles — tap twice for a mid-air flutter over the tall ones.', action: 'Run', onAction: start }
          : phase === 'over'
            ? { title: `${score} m`, body: score >= best && score > 0 ? 'New best run.' : 'Tripped on a message.', action: 'Run again', onAction: start }
            : null
      }
    >
      <canvas ref={canvas} className="game-canvas" onPointerDown={jump} />
    </Stage>
  )
}
