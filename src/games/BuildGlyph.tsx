import { useEffect, useRef, useState } from 'react'

import Stage from './Stage'
import { C, chime, font, readBest, saveBest, useCanvasLoop } from './kit'
import { GLYPH, GLYPH_BOX } from '../components/glyphShape'

const ID = 'build-glyph'
const LIVES = 3
/* Vertical seams split the mark into six strips. */
/* Six vertical strips spanning the ring's box (GLYPH_BOX x 178, w 447), with
   a little margin either side so the end strips clear its edges. */
const BOUNDS = [166, 243, 320, 397, 474, 551, 637]
const RISE = 0 // the ring has no slant, so the cuts run straight down
const TOL = 24 // glyph units of slack for a successful drop
const GAP = 2.6 // half the seam between strips

const glyphPath = new Path2D(GLYPH)
const stripPath = (k: number) => {
  const a = BOUNDS[k] + (k === 0 ? 0 : GAP)
  const b = BOUNDS[k + 1] - (k === BOUNDS.length - 2 ? 0 : GAP)
  const p = new Path2D()
  p.moveTo(a, 700)
  p.lineTo(a + RISE * (600 / 540), 40)
  p.lineTo(b + RISE * (600 / 540), 40)
  p.lineTo(b, 700)
  p.closePath()
  return p
}
const STRIPS = BOUNDS.slice(0, -1).map((_, k) => stripPath(k))

type Placed = { k: number; off: number }

export default function BuildGlyph() {
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(LIVES)
  const [best, setBest] = useState(() => readBest(ID))
  const [phase, setPhase] = useState<'ready' | 'play' | 'over' | 'won'>('ready')
  const g = useRef({
    phase: 'ready' as 'ready' | 'play' | 'over' | 'won',
    placed: [] as Placed[],
    k: 0,
    t: 0, // slide clock
    drop: -1, // >=0 while falling: progress 0..1
    dropOff: 0,
    shake: 0,
    score: 0,
    lives: LIVES,
  })

  const start = () => {
    Object.assign(g.current, { phase: 'play', placed: [], k: 0, t: 0, drop: -1, score: 0, lives: LIVES })
    setScore(0)
    setLives(LIVES)
    setPhase('play')
  }

  const release = () => {
    const s = g.current
    if (s.phase !== 'play' || s.drop >= 0) return
    s.drop = 0
    s.dropOff = slideOffset(s)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        release()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const canvas = useCanvasLoop(({ ctx, w, h, dt }) => {
    const s = g.current
    const H = Math.min(h * 0.62, w * 0.62)
    const scale = H / GLYPH_BOX.h
    const cx = w / 2
    const cy = h * 0.56
    const ox = cx - (GLYPH_BOX.x + GLYPH_BOX.w / 2) * scale
    const oy = cy - (GLYPH_BOX.y + GLYPH_BOX.h / 2) * scale
    const liftY = -(cy - h * 0.1) / scale // strip hover height, glyph units above its slot

    if (s.phase === 'play') s.t += dt
    s.shake = Math.max(0, s.shake - dt * 3)

    if (s.drop >= 0) {
      s.drop = Math.min(1, s.drop + dt * 4)
      if (s.drop >= 1) {
        const err = Math.abs(s.dropOff)
        if (err <= TOL) {
          s.placed.push({ k: s.k, off: s.dropOff })
          s.score += Math.round(100 * (1 - err / TOL))
          setScore(s.score)
          chime([528 + s.k * 66, 792 + s.k * 66], 0.05, 0.6)
          s.k++
          if (s.k >= STRIPS.length) {
            s.phase = 'won'
            chime([528, 660, 792, 1056], 0.07, 1.8)
            setBest(saveBest(ID, s.score))
            setPhase('won')
          }
        } else {
          s.lives--
          s.shake = 1
          setLives(s.lives)
          chime([220, 233], 0.05, 0.5)
          if (s.lives <= 0) {
            s.phase = 'over'
            setBest(saveBest(ID, s.score))
            setPhase('over')
          }
        }
        s.drop = -1
        s.t = 0
      }
    }

    const toScreen = () => {
      ctx.translate(ox, oy)
      ctx.scale(scale, scale)
    }
    const fillGrad = () => {
      const gr = ctx.createLinearGradient(GLYPH_BOX.x, GLYPH_BOX.y + GLYPH_BOX.h, GLYPH_BOX.x + GLYPH_BOX.w, GLYPH_BOX.y)
      gr.addColorStop(0, '#4b72f0')
      gr.addColorStop(0.55, C.glyph)
      gr.addColorStop(1, '#5b83f5')
      return gr
    }
    const drawStrip = (k: number, dx: number, dy: number, alpha = 1) => {
      ctx.save()
      toScreen()
      ctx.translate(dx, dy)
      ctx.globalAlpha = alpha
      ctx.clip(STRIPS[k])
      ctx.shadowColor = 'rgba(42,82,220,0.3)'
      ctx.shadowBlur = 18 / scale
      ctx.fillStyle = fillGrad()
      ctx.fill(glyphPath)
      ctx.restore()
    }

    /* outline of the finished glyph */
    ctx.save()
    toScreen()
    ctx.setLineDash([6 / scale, 8 / scale])
    ctx.lineWidth = 1.5 / scale
    ctx.strokeStyle = 'rgba(60,74,158,0.35)'
    ctx.stroke(glyphPath)
    ctx.fillStyle = 'rgba(42,82,220,0.04)'
    ctx.fill(glyphPath)
    /* highlight the next slot */
    if (s.phase === 'play' && s.k < STRIPS.length) {
      ctx.clip(STRIPS[s.k])
      ctx.fillStyle = 'rgba(127,130,222,0.14)'
      ctx.fill(glyphPath)
    }
    ctx.restore()

    for (const p of s.placed) drawStrip(p.k, p.off, 0)

    /* the moving strip */
    if (s.phase === 'play' && s.k < STRIPS.length) {
      const shake = Math.sin(s.shake * 40) * 10 * s.shake
      if (s.drop >= 0) {
        const e = 1 - Math.pow(1 - s.drop, 3)
        drawStrip(s.k, s.dropOff + shake, liftY * (1 - e))
      } else {
        drawStrip(s.k, slideOffset(s) + shake, liftY)
      }
    }

    ctx.fillStyle = C.ink3
    ctx.font = font(500, 13)
    ctx.textAlign = 'center'
    ctx.fillText(`Strip ${Math.min(s.k + 1, STRIPS.length)} of ${STRIPS.length}`, cx, h - 24)
  })

  const won = phase === 'won'

  return (
    <Stage
      score={score}
      best={best}
      extra={[{ label: 'Lives', value: '●'.repeat(Math.max(lives, 0)) + '○'.repeat(LIVES - Math.max(lives, 0)) }]}
      hint="Click or Space to drop"
      overlay={
        phase === 'ready'
          ? { title: 'Build the Glyph', body: 'The glyph is six strips. Drop each one into its slot — the closer, the more points. Finish it to bring the logo to life.', action: 'Play', onAction: start }
          : phase === 'over'
            ? { title: `${score} points`, body: 'Three strips missed their slot.', action: 'Try again', onAction: start }
            : null
      }
    >
      <canvas ref={canvas} className="game-canvas" onPointerDown={release} />
      {won && (
        <div className="game-overlay">
          <div className="game-card game-card--reward">
            <video className="game-reward-video" src="/MyOrbit%20Logo.mp4" autoPlay muted loop playsInline />
            <h3 className="game-card__title">Glyph complete · {score}</h3>
            <p className="game-card__body">{score >= best ? 'New best — ' : ''}the core is built.</p>
            <button type="button" className="game-card__btn" onClick={start}>
              Build again
            </button>
          </div>
        </div>
      )}
    </Stage>
  )
}

/* Ping-pong slide, faster for each strip placed. */
function slideOffset(s: { t: number; k: number }) {
  return Math.sin(s.t * (1.6 + s.k * 0.4)) * 240
}
