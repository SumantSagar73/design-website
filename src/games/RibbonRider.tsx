import { useRef, useState } from 'react'

import Stage from './Stage'
import { C, chime, clamp, font, glow, local, readBest, saveBest, useCanvasLoop } from './kit'

const ID = 'ribbon-rider'
const GRACE = 0.35 // seconds you can drift off the ribbon

export default function RibbonRider() {
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(() => readBest(ID))
  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready')
  const g = useRef({
    phase: 'ready' as 'ready' | 'play' | 'over',
    scroll: 0, // distance the ribbon has streamed past
    time: 0,
    px: 0.5,
    x: 0.5,
    off: 0,
    shown: 0,
    seed: Math.random() * 100,
  })

  const start = () => {
    Object.assign(g.current, { phase: 'play', scroll: 0, time: 0, off: 0, shown: 0, seed: Math.random() * 100 })
    setScore(0)
    setPhase('play')
  }

  const canvas = useCanvasLoop(({ ctx, w, h, dt }) => {
    const s = g.current
    const riderY = h * 0.78
    if (s.phase === 'play') {
      s.time += dt
      s.scroll += (260 + s.time * 9) * dt
    }

    /* The ribbon: centre line as layered sines of "distance down the track",
       width narrowing over time. v is track distance at screen row y. */
    const centre = (v: number) =>
      w / 2 +
      Math.sin(v * 0.0042 + s.seed) * w * 0.22 +
      Math.sin(v * 0.011 + s.seed * 2) * w * 0.08 * Math.min(1, s.time / 20)
    const width = Math.max(w * 0.07, w * 0.26 - s.time * w * 0.0035)
    const twist = (v: number) => 0.55 + 0.45 * Math.cos(v * 0.006 + s.seed) // 1 = facing, ~0.1 = edge-on
    const at = (y: number) => s.scroll + (riderY - y)

    /* draw as horizontal slices from top to bottom */
    const step = 6
    for (let y = -step; y < h + step; y += step) {
      const v = at(y)
      const c = centre(v)
      const half = (width / 2) * twist(v)
      const gr = ctx.createLinearGradient(c - half, 0, c + half, 0)
      const face = twist(v)
      gr.addColorStop(0, `rgba(163,157,237,${0.55 * face + 0.25})`)
      gr.addColorStop(0.45, `rgba(143,208,245,${0.5 * face + 0.2})`)
      gr.addColorStop(0.8, `rgba(255,196,226,${0.45 * face + 0.2})`)
      gr.addColorStop(1, `rgba(255,206,186,${0.5 * face + 0.25})`)
      ctx.fillStyle = gr
      ctx.fillRect(c - half, y, half * 2, step + 1)
      /* glassy rim highlights */
      ctx.fillStyle = 'rgba(255,255,255,0.8)'
      ctx.fillRect(c - half, y, 1.5, step + 1)
      ctx.fillRect(c + half - 1.5, y, 1.5, step + 1)
    }

    /* rider follows the pointer, eased */
    s.x += (s.px - s.x) * (1 - Math.exp(-dt * 12))
    const rx = s.x * w
    const v = at(riderY)
    const c = centre(v)
    const half = (width / 2) * twist(v)
    const onRibbon = Math.abs(rx - c) <= half + 4

    if (s.phase === 'play') {
      s.off = onRibbon ? Math.max(0, s.off - dt * 2) : s.off + dt
      if (s.off >= GRACE) {
        s.phase = 'over'
        chime([220, 233], 0.06, 0.6)
        setBest(saveBest(ID, s.shown))
        setPhase('over')
      }
      const pts = Math.floor(s.scroll / 50)
      if (pts !== s.shown) {
        if (pts % 50 === 0) chime([528, 660], 0.04, 0.5)
        s.shown = pts
        setScore(pts)
      }
    }

    const danger = clamp(s.off / GRACE, 0, 1)
    glow(ctx, rx, riderY, 34, danger > 0 ? 'rgba(224,69,123,0.45)' : 'rgba(60,74,158,0.35)')
    ctx.fillStyle = danger > 0 ? '#e0457b' : C.ink
    ctx.beginPath()
    ctx.arc(rx, riderY, 9, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()

    if (danger > 0 && s.phase === 'play') {
      ctx.fillStyle = '#c2356a'
      ctx.font = font(600, 13)
      ctx.textAlign = 'center'
      ctx.fillText('Back on the ribbon!', rx, riderY + 34)
    }
  })

  return (
    <Stage
      score={score}
      best={best}
      hint="Move the pointer to steer"
      overlay={
        phase === 'ready'
          ? { title: 'Ribbon Rider', body: 'Ride the hero’s glass ribbon as it twists toward you. It narrows as you go — drift off for too long and you fall.', action: 'Ride', onAction: start }
          : phase === 'over'
            ? { title: `${score} m`, body: score >= best && score > 0 ? 'New best ride.' : 'The ribbon twisted away.', action: 'Ride again', onAction: start }
            : null
      }
    >
      <canvas
        ref={canvas}
        className="game-canvas"
        onPointerMove={(e) => {
          const q = local(e, e.currentTarget)
          g.current.px = q.x / e.currentTarget.getBoundingClientRect().width
        }}
      />
    </Stage>
  )
}
