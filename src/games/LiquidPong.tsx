import { useRef, useState } from 'react'

import Stage from './Stage'
import { C, chime, clamp, font, local, readBest, ribbonGradient, saveBest, useCanvasLoop } from './kit'

const ID = 'liquid-pong'
const TO = 7

type Ripple = { x: number; y: number; r: number; life: number }

/**
 * `side`: paddles left and right (you on the left).
 * `stack`: the same court turned 90°, paddles top and bottom (you at the
 * bottom). The game runs in court coordinates either way and is rotated only
 * when drawn, so physics and feel are identical.
 */
export default function LiquidPong({ orientation = 'side' }: { orientation?: 'side' | 'stack' }) {
  const stack = orientation === 'stack'
  /* Separate best score per orientation. */
  const id = stack ? `${ID}-horizontal` : ID
  const [you, setYou] = useState(0)
  const [ray, setRay] = useState(0)
  const [best, setBest] = useState(() => readBest(id))
  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready')
  const g = useRef({
    phase: 'ready' as 'ready' | 'play' | 'over',
    ball: { x: 0, y: 0, vx: 0, vy: 0 },
    trail: [] as { x: number; y: number }[],
    py: 0.5, // player paddle target (0..1)
    pY: 0.5,
    aY: 0.5,
    you: 0,
    ray: 0,
    serve: 0.8,
    ripples: [] as Ripple[],
    size: { w: 1, h: 1 },
  })

  const serve = (dir: 1 | -1) => {
    const s = g.current
    const { w, h } = s.size
    const sp = Math.min(w, h) * 0.75
    const a = (Math.random() - 0.5) * 0.8
    s.ball = { x: w / 2, y: h / 2, vx: Math.cos(a) * sp * dir, vy: Math.sin(a) * sp }
    s.trail = []
    s.serve = 0.8
  }

  const start = () => {
    Object.assign(g.current, { phase: 'play', you: 0, ray: 0, ripples: [] })
    setYou(0)
    setRay(0)
    serve(Math.random() < 0.5 ? 1 : -1)
    setPhase('play')
  }

  const canvas = useCanvasLoop(({ ctx, w: sw, h: sh, dt }) => {
    const s = g.current
    /* Court size: the long axis is always the ball's direction of play. */
    const w = stack ? sh : sw
    const h = stack ? sw : sh
    s.size = { w, h }
    const padH = h * 0.18
    const padW = Math.max(10, w * 0.012)
    const margin = w * 0.05
    const R = Math.max(8, Math.min(w, h) * 0.018)

    /* paddles: yours eases to the pointer; Ray tracks the ball, capped speed */
    s.pY += (s.py - s.pY) * (1 - Math.exp(-dt * 18))
    const aim = s.ball.vx > 0 ? s.ball.y / h : 0.5
    const maxStep = (0.9 + (s.you + s.ray) * 0.06) * dt
    s.aY += clamp(aim - s.aY, -maxStep, maxStep)
    const pTop = clamp(s.pY * h - padH / 2, 0, h - padH)
    const aTop = clamp(s.aY * h - padH / 2, 0, h - padH)

    if (s.phase === 'play') {
      if (s.serve > 0) s.serve -= dt
      else {
        const sub = 3
        for (let k = 0; k < sub; k++) {
          const b = s.ball
          b.x += (b.vx * dt) / sub
          b.y += (b.vy * dt) / sub
          if (b.y < R || b.y > h - R) {
            b.y = clamp(b.y, R, h - R)
            b.vy *= -1
            s.ripples.push({ x: b.x, y: b.y, r: 4, life: 1 })
          }
          const hit = (padX: number, top: number, dir: 1 | -1) => {
            const within = b.y > top - R && b.y < top + padH + R
            const crossing = dir === 1 ? b.x - R < padX + padW && b.vx < 0 : b.x + R > padX && b.vx > 0
            const near = dir === 1 ? b.x > padX - R : b.x < padX + padW + R
            if (within && crossing && near) {
              /* angle from where it lands on the paddle, speed up a touch */
              const rel = (b.y - (top + padH / 2)) / (padH / 2)
              const sp = Math.hypot(b.vx, b.vy) * 1.05
              const ang = rel * 0.9
              b.vx = Math.cos(ang) * sp * dir
              b.vy = Math.sin(ang) * sp
              b.x = dir === 1 ? padX + padW + R : padX - R
              s.ripples.push({ x: b.x, y: b.y, r: 6, life: 1 })
              chime([dir === 1 ? 528 : 440], 0.04, 0.3)
            }
          }
          hit(margin, pTop, 1)
          hit(w - margin - padW, aTop, -1)
        }
        const b = s.ball
        if (b.x < -R * 2 || b.x > w + R * 2) {
          const youScored = b.x > w
          if (youScored) s.you++
          else s.ray++
          setYou(s.you)
          setRay(s.ray)
          chime(youScored ? [528, 660, 792] : [220, 233], 0.05, 0.8)
          if (s.you >= TO || s.ray >= TO) {
            s.phase = 'over'
            setBest(saveBest(id, s.you))
            setPhase('over')
          } else serve(youScored ? -1 : 1)
        }
      }
    }

    /* Everything below is drawn in court space; in 'stack' mode that's
       turned 90° so your end (court left) sits at the bottom of the screen. */
    ctx.save()
    if (stack) ctx.transform(0, -1, 1, 0, 0, sh)

    /* centre line */
    ctx.save()
    ctx.setLineDash([4, 10])
    ctx.strokeStyle = C.line
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(w / 2, 0)
    ctx.lineTo(w / 2, h)
    ctx.stroke()
    ctx.restore()
    /* big faint score, always upright on screen */
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    const dpr = ctx.canvas.width / sw
    ctx.scale(dpr, dpr)
    ctx.fillStyle = 'rgba(11,14,24,0.08)'
    ctx.font = font(500, Math.min(sw, sh) * 0.22)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    if (stack) {
      ctx.fillText(String(s.you), sw / 2, sh * 0.7)
      ctx.fillText(String(s.ray), sw / 2, sh * 0.3)
    } else {
      ctx.fillText(String(s.you), sw * 0.3, sh / 2)
      ctx.fillText(String(s.ray), sw * 0.7, sh / 2)
    }
    ctx.restore()

    /* ripples */
    for (let i = s.ripples.length - 1; i >= 0; i--) {
      const r = s.ripples[i]
      r.life -= dt * 1.4
      r.r += dt * 160
      if (r.life <= 0) {
        s.ripples.splice(i, 1)
        continue
      }
      ctx.strokeStyle = `rgba(127,130,222,${r.life * 0.45})`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2)
      ctx.stroke()
    }

    /* paddles: glass pills in the ribbon gradient */
    const pill = (x: number, y: number) => {
      ctx.save()
      ctx.shadowColor = 'rgba(60,74,158,0.3)'
      ctx.shadowBlur = 16
      ctx.fillStyle = ribbonGradient(ctx, x, y, x + padW, y + padH)
      ctx.beginPath()
      ctx.roundRect(x, y, padW, padH, padW / 2)
      ctx.fill()
      ctx.restore()
    }
    pill(margin, pTop)
    pill(w - margin - padW, aTop)

    /* ball: split into cyan / magenta / yellow along its velocity — more
       split the faster it flies, like the liquid glitch text */
    const b = s.ball
    s.trail.push({ x: b.x, y: b.y })
    if (s.trail.length > 14) s.trail.shift()
    ctx.save()
    ctx.globalCompositeOperation = 'multiply'
    s.trail.forEach((p, i) => {
      ctx.globalAlpha = (i / s.trail.length) * 0.25
      ctx.fillStyle = '#c4ccfa'
      ctx.beginPath()
      ctx.arc(p.x, p.y, R * (i / s.trail.length), 0, Math.PI * 2)
      ctx.fill()
    })
    const sp = Math.hypot(b.vx, b.vy)
    const split = clamp(sp / 900, 0, 1) * R * 0.9
    const ux = sp ? b.vx / sp : 0
    const uy = sp ? b.vy / sp : 0
    ctx.globalAlpha = 0.9
    for (const [off, col] of [[-split, '#3be3f0'], [0, '#f06ad0'], [split, '#ffd84a']] as const) {
      ctx.fillStyle = col
      ctx.beginPath()
      ctx.arc(b.x - ux * off, b.y - uy * off, R, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
    ctx.restore() // court transform
  })

  return (
    <Stage
      extra={[
        { label: 'You', value: you },
        { label: 'Ray', value: ray },
      ]}
      best={best}
      hint={stack ? 'Move the pointer left and right' : 'Move the pointer up and down'}
      overlay={
        phase === 'ready'
          ? { title: 'Liquid Pong', body: `First to ${TO} against Ray. The faster the ball, the more its colour splits — like the liquid text.`, action: 'Play', onAction: start }
          : phase === 'over'
            ? { title: you > ray ? 'You beat Ray' : 'Ray wins', body: `${you} – ${ray}${you >= best && you > 0 ? ' · New best.' : ''}`, action: 'Rematch', onAction: start }
            : null
      }
    >
      <canvas
        ref={canvas}
        className="game-canvas"
        onPointerMove={(e) => {
          const q = local(e, e.currentTarget)
          const r = e.currentTarget.getBoundingClientRect()
          /* Across the court: screen y for side, screen x for stack. */
          g.current.py = stack ? q.x / r.width : q.y / r.height
        }}
      />
    </Stage>
  )
}
