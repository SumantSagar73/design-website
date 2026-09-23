import { useEffect, useRef, useState } from 'react'

import Stage from './Stage'
import { STATES, STATE_KEYS, chime, font, readBest, rgba, saveBest, useCanvasLoop, type StateKey } from './kit'

const ID = 'state-stack'
const PERFECT = 5 // px of slack that still counts as perfect
/* Perfect drops climb this scale, so a streak plays a rising melody. */
const MELODY = [432, 486, 528, 594, 648, 729, 792, 864, 972, 1056]

type Block = { x: number; w: number; kind: StateKey }
type Chip = { x: number; y: number; w: number; vy: number; vr: number; rot: number; kind: StateKey; life: number }

export default function StateStack() {
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(() => readBest(ID))
  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready')
  const g = useRef({
    phase: 'ready' as 'ready' | 'play' | 'over',
    tower: [] as Block[],
    moving: null as null | { x: number; w: number; dir: 1 | -1; speed: number; kind: StateKey },
    chips: [] as Chip[],
    cam: 0,
    streak: 0,
    note: 0,
    glow: 0,
    size: { w: 1, h: 1 },
  })

  const kindAt = (i: number) => STATE_KEYS[i % 4]

  const spawn = () => {
    const s = g.current
    const top = s.tower[s.tower.length - 1]
    const dir: 1 | -1 = s.tower.length % 2 ? 1 : -1
    s.moving = {
      x: dir === 1 ? -top.w : s.size.w,
      w: top.w,
      dir,
      speed: s.size.w * (0.32 + s.tower.length * 0.012),
      kind: kindAt(s.tower.length),
    }
  }

  const start = () => {
    const s = g.current
    const bw = s.size.w * 0.34
    Object.assign(s, { phase: 'play', tower: [{ x: (s.size.w - bw) / 2, w: bw, kind: 'Calm' as StateKey }], chips: [], cam: 0, streak: 0, note: 0 })
    spawn()
    setScore(0)
    setPhase('play')
  }

  const drop = () => {
    const s = g.current
    if (s.phase !== 'play' || !s.moving) return
    const m = s.moving
    const top = s.tower[s.tower.length - 1]
    let x = m.x
    let wdt = m.w
    const off = m.x - top.x
    if (Math.abs(off) <= PERFECT) {
      /* perfect: snap, keep the width, play the next note up */
      x = top.x
      s.streak++
      s.glow = 1
      chime([MELODY[s.note % MELODY.length], MELODY[s.note % MELODY.length] * 1.5], 0.06, 0.8)
      s.note++
      /* a long streak earns a little width back */
      if (s.streak % 4 === 0) {
        wdt = Math.min(wdt + 12, s.size.w * 0.34)
        x = top.x - (wdt - top.w) / 2
      }
    } else {
      const l = Math.max(m.x, top.x)
      const r = Math.min(m.x + m.w, top.x + top.w)
      if (r - l <= 0) {
        s.chips.push({ x: m.x, y: 0, w: m.w, vy: 0, vr: m.dir * 1.5, rot: 0, kind: m.kind, life: 1.5 })
        s.moving = null
        s.phase = 'over'
        chime([220, 233], 0.06, 0.6)
        setBest(saveBest(ID, s.tower.length - 1))
        setPhase('over')
        return
      }
      /* the overhang breaks off and falls */
      const cutX = m.x < top.x ? m.x : r
      const cutW = m.w - (r - l)
      s.chips.push({ x: cutX, y: 0, w: cutW, vy: 0, vr: (m.x < top.x ? -1 : 1) * 2, rot: 0, kind: m.kind, life: 1.5 })
      x = l
      wdt = r - l
      s.streak = 0
      s.note = 0
      chime([STATES[m.kind].chord[0]], 0.04, 0.4)
    }
    s.tower.push({ x, w: wdt, kind: m.kind })
    setScore(s.tower.length - 1)
    spawn()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        drop()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const canvas = useCanvasLoop(({ ctx, w, h, dt }) => {
    const s = g.current
    s.size = { w, h }
    const bh = Math.max(26, h * 0.065)
    const base = h * 0.86
    const yOf = (i: number) => base - (i + 1) * bh + s.cam
    s.glow = Math.max(0, s.glow - dt * 2)

    /* camera keeps the top of the tower in the upper-middle */
    const want = Math.max(0, s.tower.length * bh - h * 0.5)
    s.cam += (want - s.cam) * (1 - Math.exp(-dt * 5))

    if (s.moving && s.phase === 'play') {
      const m = s.moving
      m.x += m.dir * m.speed * dt
      if (m.x > w - m.w * 0.2) m.dir = -1
      if (m.x < -m.w * 0.8) m.dir = 1
    }

    const block = (x: number, y: number, bw: number, kind: StateKey, alpha = 1, rot = 0) => {
      const st = STATES[kind]
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.translate(x + bw / 2, y + bh / 2)
      ctx.rotate(rot)
      const gr = ctx.createLinearGradient(-bw / 2, 0, bw / 2, 0)
      gr.addColorStop(0, rgba(st.color, 0.95))
      gr.addColorStop(1, rgba(st.color, 0.72))
      ctx.fillStyle = gr
      ctx.shadowColor = rgba(st.color, 0.3)
      ctx.shadowBlur = 12
      ctx.beginPath()
      ctx.roundRect(-bw / 2, -bh / 2 + 1, bw, bh - 2, 6)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      ctx.fillRect(-bw / 2 + 6, -bh / 2 + 4, bw - 12, 2)
      if (bw > 70) {
        ctx.fillStyle = '#fff'
        ctx.font = font(600, Math.min(15, bh * 0.42))
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(kind, 0, 1)
      }
      ctx.restore()
    }

    /* ground */
    ctx.fillStyle = 'rgba(60,74,158,0.18)'
    ctx.fillRect(w * 0.2, base + s.cam, w * 0.6, 2)

    s.tower.forEach((b, i) => {
      if (yOf(i) > h + bh) return
      block(b.x, yOf(i), b.w, b.kind)
    })
    if (s.glow > 0 && s.tower.length) {
      const top = s.tower[s.tower.length - 1]
      ctx.strokeStyle = `rgba(255,255,255,${s.glow})`
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.roundRect(top.x - 4 * s.glow, yOf(s.tower.length - 1) - 4 * s.glow, top.w + 8 * s.glow, bh + 8 * s.glow, 8)
      ctx.stroke()
    }
    if (s.moving) block(s.moving.x, yOf(s.tower.length), s.moving.w, s.moving.kind)

    for (let i = s.chips.length - 1; i >= 0; i--) {
      const c = s.chips[i]
      c.vy += h * 1.6 * dt
      c.y += c.vy * dt
      c.rot += c.vr * dt
      c.life -= dt
      if (c.life <= 0) {
        s.chips.splice(i, 1)
        continue
      }
      block(c.x, yOf(s.tower.length - 1) + c.y, c.w, c.kind, Math.min(1, c.life), c.rot)
    }

    if (s.streak > 1 && s.phase === 'play') {
      ctx.fillStyle = STATES[kindAt(s.tower.length - 1)].color
      ctx.font = font(600, 14)
      ctx.textAlign = 'center'
      ctx.fillText(`Perfect ×${s.streak}`, w / 2, 84)
    }
  })

  return (
    <Stage
      score={score}
      best={best}
      hint="Click or Space to drop"
      overlay={
        phase === 'ready'
          ? { title: 'State Stack', body: 'Stack the states — Calm, Active, Alert, Resolve — as high as you can. Overhangs break off. Perfect drops keep their width and play a rising melody.', action: 'Stack', onAction: start }
          : phase === 'over'
            ? { title: `${score} high`, body: score >= best && score > 0 ? 'New best tower.' : 'The stack slipped.', action: 'Stack again', onAction: start }
            : null
      }
    >
      <canvas ref={canvas} className="game-canvas" onPointerDown={drop} />
    </Stage>
  )
}
