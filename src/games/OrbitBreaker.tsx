import { useEffect, useRef, useState } from 'react'

import Stage from './Stage'
import { C, STATES, chime, clamp, drawGlassRing, font, glow, local, readBest, rgba, ribbonGradient, saveBest, useCanvasLoop, type StateKey } from './kit'
import { GLYPH_SLANT } from '../components/glyphShape'

const ID = 'orbit-breaker'
const LIVES = 3
const COLS = 10
/* Row colours, top to bottom: the ribbon, then the hero haze. */
const ROWS = ['#3c4a9e', '#5a67c4', '#7f82de', '#a39ded', '#8fd0f5', '#ffc4e2', '#ffceba']
/* Level layouts: '#' tough glyph brick (2 hits), 'o' normal, '.' empty. */
const LEVELS = [
  ['..........', 'oooooooooo', 'oooooooooo', 'oo######oo', 'oooooooooo', 'oooooooooo', '..........'],
  ['...####...', '..oooooo..', '.oooooooo.', 'oooo##oooo', '.oooooooo.', '..oooooo..', '...oooo...'],
  ['#o#o#o#o#o', 'oooooooooo', 'o##oooo##o', 'oooooooooo', '#oooooooo#', 'oo#oooo#oo', 'oooooooooo'],
]
const POWER_CHANCE = 0.14
const POWERS: StateKey[] = ['Calm', 'Active', 'Alert', 'Resolve']

type Brick = { x: number; y: number; w: number; h: number; hp: number; tough: boolean; color: string; hit: number }
type Ball = { x: number; y: number; vx: number; vy: number; spin: number }
type Drop = { x: number; y: number; kind: StateKey }
type Bit = { x: number; y: number; vx: number; vy: number; life: number; color: string; s: number }

export default function OrbitBreaker() {
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(LIVES)
  const [level, setLevel] = useState(1)
  const [best, setBest] = useState(() => readBest(ID))
  const [phase, setPhase] = useState<'ready' | 'play' | 'over' | 'clear'>('ready')
  const [power, setPower] = useState<string>('—')
  const g = useRef({
    phase: 'ready' as 'ready' | 'play' | 'over' | 'clear',
    bricks: [] as Brick[],
    balls: [] as Ball[],
    drops: [] as Drop[],
    bits: [] as Bit[],
    stuck: true, // ball resting on the paddle
    px: 0.5, // paddle target, 0..1
    pX: 0.5,
    score: 0,
    lives: LIVES,
    level: 0,
    wide: 0, // seconds left
    slow: 0,
    keys: { l: false, r: false },
    size: { w: 1, h: 1 },
    built: -1,
  })

  const build = (lv: number) => {
    const s = g.current
    const { w, h } = s.size
    const layout = LEVELS[lv % LEVELS.length]
    const top = h * 0.12
    const gap = Math.max(4, w * 0.006)
    const side = w * 0.07
    const bw = (w - side * 2 - gap * (COLS - 1)) / COLS
    const bh = Math.max(14, h * 0.035)
    s.bricks = []
    layout.forEach((row, r) =>
      [...row].forEach((c, col) => {
        if (c === '.') return
        const tough = c === '#'
        s.bricks.push({
          x: side + col * (bw + gap), y: top + r * (bh + gap), w: bw, h: bh,
          hp: tough ? 2 : 1, tough, color: tough ? C.glyph : ROWS[r % ROWS.length], hit: 0,
        })
      }),
    )
    s.built = lv
  }

  const resetBall = () => {
    const s = g.current
    s.balls = [{ x: 0, y: 0, vx: 0, vy: 0, spin: 0 }]
    s.stuck = true
  }

  const start = () => {
    const s = g.current
    Object.assign(s, { phase: 'play', score: 0, lives: LIVES, level: 0, drops: [], bits: [], wide: 0, slow: 0 })
    build(0)
    resetBall()
    setScore(0)
    setLives(LIVES)
    setLevel(1)
    setPower('—')
    setPhase('play')
  }

  const nextLevel = () => {
    const s = g.current
    s.level++
    build(s.level)
    s.drops = []
    resetBall()
    s.phase = 'play'
    setLevel(s.level + 1)
    setPhase('play')
  }

  const launch = () => {
    const s = g.current
    if (s.phase !== 'play' || !s.stuck) return
    const sp = speed()
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 0.6
    s.balls[0].vx = Math.cos(a) * sp
    s.balls[0].vy = Math.sin(a) * sp
    s.stuck = false
  }

  const speed = () => {
    const s = g.current
    return Math.min(s.size.w, s.size.h) * (0.85 + s.level * 0.12) * (s.slow > 0 ? 0.62 : 1)
  }

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft') g.current.keys.l = true
      if (e.code === 'ArrowRight') g.current.keys.r = true
      if (e.code === 'Space') {
        e.preventDefault()
        launch()
      }
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
    const prev = s.size
    s.size = { w, h }
    if (s.built < 0) build(0)
    else if ((prev.w !== w || prev.h !== h) && prev.w > 1) {
      /* Scale the wall in place so a resize never restores broken bricks. */
      const sx = w / prev.w
      const sy = h / prev.h
      for (const q of s.bricks) Object.assign(q, { x: q.x * sx, y: q.y * sy, w: q.w * sx, h: q.h * sy })
      for (const b of s.balls) Object.assign(b, { x: b.x * sx, y: b.y * sy })
      for (const d of s.drops) Object.assign(d, { x: d.x * sx, y: d.y * sy })
    }

    const R = Math.max(7, Math.min(w, h) * 0.014)
    const padW = w * (s.wide > 0 ? 0.2 : 0.13)
    const padH = Math.max(12, h * 0.022)
    const padY = h - h * 0.08

    /* paddle */
    if (s.keys.l) s.px -= dt * 1.2
    if (s.keys.r) s.px += dt * 1.2
    s.px = clamp(s.px, 0, 1)
    s.pX += (s.px - s.pX) * (1 - Math.exp(-dt * 20))
    const padX = clamp(s.pX * w - padW / 2, 0, w - padW)

    if (s.phase === 'play') {
      s.wide = Math.max(0, s.wide - dt)
      s.slow = Math.max(0, s.slow - dt)
      const active = [s.wide > 0 && 'Alert', s.slow > 0 && 'Calm'].filter(Boolean).join(' · ') || '—'
      if (active !== powerRef.current) {
        powerRef.current = active
        setPower(active)
      }

      if (s.stuck) {
        s.balls[0].x = padX + padW / 2
        s.balls[0].y = padY - R - 1
      } else {
        const target = speed()
        const sub = 4
        for (const b of s.balls) {
          /* ease toward the current target speed (slow power-up) */
          const sp = Math.hypot(b.vx, b.vy) || 1
          const k = 1 + (target / sp - 1) * Math.min(1, dt * 3)
          b.vx *= k
          b.vy *= k
          b.spin += dt * 4
          for (let i = 0; i < sub; i++) {
            b.x += (b.vx * dt) / sub
            b.y += (b.vy * dt) / sub
            if (b.x < R || b.x > w - R) {
              b.x = clamp(b.x, R, w - R)
              b.vx *= -1
            }
            if (b.y < R) {
              b.y = R
              b.vy *= -1
            }
            /* paddle: bounce angle from where it lands */
            if (b.vy > 0 && b.y + R >= padY && b.y + R <= padY + padH + R && b.x > padX - R && b.x < padX + padW + R) {
              const rel = clamp((b.x - (padX + padW / 2)) / (padW / 2), -1, 1)
              const a = -Math.PI / 2 + rel * 1.05
              const v = Math.hypot(b.vx, b.vy)
              b.vx = Math.cos(a) * v
              b.vy = Math.sin(a) * v
              b.y = padY - R
              chime([392], 0.03, 0.2)
            }
            /* bricks: resolve on the shallower axis */
            for (let j = s.bricks.length - 1; j >= 0; j--) {
              const q = s.bricks[j]
              if (b.x + R < q.x || b.x - R > q.x + q.w || b.y + R < q.y || b.y - R > q.y + q.h) continue
              const ox = Math.min(b.x + R - q.x, q.x + q.w - (b.x - R))
              const oy = Math.min(b.y + R - q.y, q.y + q.h - (b.y - R))
              if (ox < oy) b.vx *= -1
              else b.vy *= -1
              q.hp--
              q.hit = 1
              if (q.hp <= 0) breakBrick(j)
              else chime([660], 0.03, 0.25)
              break
            }
          }
        }
        s.balls = s.balls.filter((b) => b.y < h + R * 4)
        if (!s.balls.length) {
          s.lives--
          setLives(s.lives)
          chime([220, 233], 0.05, 0.6)
          if (s.lives <= 0) {
            s.phase = 'over'
            setBest(saveBest(ID, s.score))
            setPhase('over')
          } else resetBall()
        }
        if (!s.bricks.length && s.phase === 'play') {
          s.phase = 'clear'
          chime([528, 660, 792, 1056], 0.07, 1.6)
          setBest(saveBest(ID, s.score))
          setPhase('clear')
        }
      }

      /* falling power-ups */
      for (let i = s.drops.length - 1; i >= 0; i--) {
        const d = s.drops[i]
        d.y += h * 0.28 * dt
        if (d.y > padY - 10 && d.y < padY + padH + 10 && d.x > padX - 12 && d.x < padX + padW + 12) {
          apply(d.kind)
          s.drops.splice(i, 1)
        } else if (d.y > h + 20) s.drops.splice(i, 1)
      }
    }

    /* bricks: parallelograms leaning at the glyph's slant */
    const lean = -GLYPH_SLANT
    for (const q of s.bricks) {
      q.hit = Math.max(0, q.hit - dt * 4)
      const sk = q.h * lean
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(q.x + sk, q.y)
      ctx.lineTo(q.x + q.w, q.y)
      ctx.lineTo(q.x + q.w - sk, q.y + q.h)
      ctx.lineTo(q.x, q.y + q.h)
      ctx.closePath()
      const gr = ctx.createLinearGradient(q.x, q.y + q.h, q.x + q.w, q.y)
      gr.addColorStop(0, rgba(q.color, 0.95))
      gr.addColorStop(1, rgba(q.color, 0.7))
      ctx.fillStyle = gr
      ctx.shadowColor = rgba(q.color, 0.35)
      ctx.shadowBlur = 10 + q.hit * 14
      ctx.fill()
      ctx.shadowBlur = 0
      if (q.tough) {
        /* glyph stripes; a cracked brick loses its sheen */
        ctx.clip()
        ctx.strokeStyle = q.hp > 1 ? 'rgba(214,228,255,0.8)' : 'rgba(255,255,255,0.35)'
        ctx.lineWidth = 2
        for (let k = 1; k < 4; k++) {
          const x = q.x + (q.w * k) / 4
          ctx.beginPath()
          ctx.moveTo(x - sk, q.y + q.h)
          ctx.lineTo(x + sk, q.y)
          ctx.stroke()
        }
      }
      ctx.restore()
    }

    /* particles */
    for (let i = s.bits.length - 1; i >= 0; i--) {
      const p = s.bits[i]
      p.vy += h * 0.9 * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.life -= dt * 1.4
      if (p.life <= 0) {
        s.bits.splice(i, 1)
        continue
      }
      ctx.globalAlpha = p.life
      ctx.fillStyle = p.color
      ctx.fillRect(p.x, p.y, p.s, p.s)
    }
    ctx.globalAlpha = 1

    /* drops: state-coloured capsules */
    for (const d of s.drops) {
      const c = STATES[d.kind].color
      glow(ctx, d.x, d.y, 22, rgba(c, 0.35))
      ctx.fillStyle = c
      ctx.beginPath()
      ctx.roundRect(d.x - 16, d.y - 7, 32, 14, 7)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = font(700, 9)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(d.kind[0], d.x, d.y + 0.5)
    }

    /* paddle: glass pill */
    ctx.save()
    ctx.shadowColor = 'rgba(60,74,158,0.35)'
    ctx.shadowBlur = 18
    ctx.fillStyle = ribbonGradient(ctx, padX, padY, padX + padW, padY + padH)
    ctx.beginPath()
    ctx.roundRect(padX, padY, padW, padH, padH / 2)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.beginPath()
    ctx.roundRect(padX + padH * 0.4, padY + 2, padW - padH * 0.8, padH * 0.32, padH * 0.16)
    ctx.fill()
    ctx.restore()

    /* balls: little orbit rings */
    for (const b of s.balls) {
      glow(ctx, b.x, b.y, R * 3.2, 'rgba(127,130,222,0.3)')
      drawGlassRing(ctx, b.x, b.y, R, { tilt: b.spin, squash: 0.7, width: R * 0.55 })
    }

    if (s.stuck && s.phase === 'play') {
      ctx.fillStyle = C.ink3
      ctx.font = font(500, 13)
      ctx.textAlign = 'center'
      ctx.fillText('Click or Space to launch', w / 2, padY - R * 5)
    }
    void t
  })
  const powerRef = useRef('—')

  function breakBrick(j: number) {
    const s = g.current
    const q = s.bricks[j]
    s.bricks.splice(j, 1)
    s.score += q.tough ? 25 : 10
    setScore(s.score)
    chime([528 + Math.random() * 200], 0.035, 0.3)
    for (let k = 0; k < 10; k++) {
      s.bits.push({
        x: q.x + Math.random() * q.w, y: q.y + Math.random() * q.h,
        vx: (Math.random() - 0.5) * 260, vy: -Math.random() * 180, life: 1, color: q.color, s: 2 + Math.random() * 3,
      })
    }
    if (Math.random() < POWER_CHANCE) {
      s.drops.push({ x: q.x + q.w / 2, y: q.y + q.h / 2, kind: POWERS[Math.floor(Math.random() * POWERS.length)] })
    }
  }

  function apply(kind: StateKey) {
    const s = g.current
    chime(STATES[kind].chord, 0.05, 0.9)
    if (kind === 'Calm') s.slow = 8
    if (kind === 'Alert') s.wide = 10
    if (kind === 'Resolve') {
      s.lives++
      setLives(s.lives)
    }
    if (kind === 'Active' && s.balls.length && !s.stuck) {
      const b = s.balls[0]
      for (const a of [-0.5, 0.5]) {
        const v = Math.hypot(b.vx, b.vy)
        const ang = Math.atan2(b.vy, b.vx) + a
        s.balls.push({ x: b.x, y: b.y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, spin: 0 })
      }
    }
  }

  return (
    <Stage
      score={score}
      best={best}
      extra={[
        { label: 'Level', value: level },
        { label: 'Lives', value: '●'.repeat(Math.max(lives, 0)) },
        { label: 'Power', value: power },
      ]}
      hint="Move pointer or ← → · Space to launch"
      overlay={
        phase === 'ready'
          ? {
              title: 'Orbit Breaker',
              body: 'Break the orbit wall. Blue mark bricks take two hits. Catch the state capsules: Calm slows the ball, Active splits it, Alert widens you, Resolve adds a life.',
              action: 'Play',
              onAction: start,
            }
          : phase === 'over'
            ? { title: `${score} points`, body: score >= best && score > 0 ? 'New best.' : 'The orbit slipped. Again?', action: 'Play again', onAction: start }
            : phase === 'clear'
              ? { title: `Level ${level} clear`, body: `${score} points so far. The next wall is faster.`, action: 'Next level', onAction: nextLevel }
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
        onPointerDown={launch}
      />
    </Stage>
  )
}
