import { useRef, useState } from 'react'

import Stage from './Stage'
import { STATES, STATE_KEYS, chime, drawRayMark, font, glow, local, rand, readBest, rgba, ribbonGradient, saveBest, useCanvasLoop, type StateKey } from './kit'

const ID = 'caustic-catch'
const LIVES = 3
const CALL_EVERY = 7 // seconds between Ray's calls

type Coin = { x: number; y: number; vy: number; kind: StateKey; wob: number }
type Pop = { x: number; y: number; text: string; color: string; life: number }

export default function CausticCatch() {
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(LIVES)
  const [best, setBest] = useState(() => readBest(ID))
  const [call, setCall] = useState<StateKey>('Success')
  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready')
  const g = useRef({
    phase: 'ready' as 'ready' | 'play' | 'over',
    coins: [] as Coin[],
    pops: [] as Pop[],
    px: 0.5,
    x: 0.5,
    call: 'Success' as StateKey,
    callT: CALL_EVERY,
    spawn: 0,
    time: 0,
    score: 0,
    combo: 0,
    lives: LIVES,
    flash: 0,
  })

  const newCall = (not?: StateKey) => {
    const pool = STATE_KEYS.filter((k) => k !== not)
    const next = pool[Math.floor(Math.random() * pool.length)]
    g.current.call = next
    g.current.callT = CALL_EVERY
    g.current.flash = 1
    setCall(next)
    chime(STATES[next].chord.slice(0, 2), 0.04, 0.6)
  }

  const start = () => {
    Object.assign(g.current, { phase: 'play', coins: [], pops: [], spawn: 0.4, time: 0, score: 0, combo: 0, lives: LIVES })
    newCall()
    setScore(0)
    setLives(LIVES)
    setPhase('play')
  }

  const canvas = useCanvasLoop(({ ctx, w, h, dt, t }) => {
    const s = g.current
    const catchY = h * 0.86
    const padW = Math.max(90, w * 0.11)
    const R = Math.max(14, Math.min(w, h) * 0.024)
    s.flash = Math.max(0, s.flash - dt * 1.5)

    /* caustics: slow interfering light bands across the stage */
    ctx.save()
    ctx.globalAlpha = 0.5
    for (let k = 0; k < 7; k++) {
      ctx.strokeStyle = k % 2 ? 'rgba(143,208,245,0.18)' : 'rgba(163,157,237,0.16)'
      ctx.lineWidth = 18
      ctx.beginPath()
      for (let x = 0; x <= w; x += 24) {
        const y = (h / 7) * k + Math.sin(x * 0.008 + t * 0.6 + k) * 26 + Math.sin(x * 0.019 - t * 0.9 + k * 2) * 12
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
    ctx.restore()

    if (s.phase === 'play') {
      s.time += dt
      s.callT -= dt
      if (s.callT <= 0) newCall(s.call)
      s.spawn -= dt
      if (s.spawn <= 0) {
        /* bias toward the called state so there's always something to catch */
        const kind = Math.random() < 0.38 ? s.call : STATE_KEYS[Math.floor(Math.random() * 4)]
        s.coins.push({ x: rand(R * 2, w - R * 2), y: -R * 2, vy: h * rand(0.22, 0.32) * (1 + s.time / 70), kind, wob: rand(0, 6) })
        s.spawn = Math.max(0.28, 0.75 - s.time / 90)
      }
    }

    s.x += (s.px - s.x) * (1 - Math.exp(-dt * 16))
    const padX = Math.min(Math.max(s.x * w - padW / 2, 0), w - padW)

    for (let i = s.coins.length - 1; i >= 0; i--) {
      const c = s.coins[i]
      c.y += c.vy * dt
      const cx = c.x + Math.sin(t * 2 + c.wob) * 10
      if (s.phase === 'play' && c.y + R >= catchY && c.y - R <= catchY + 14 && cx > padX - R * 0.6 && cx < padX + padW + R * 0.6) {
        s.coins.splice(i, 1)
        if (c.kind === s.call) {
          s.combo++
          s.score += 10 + (s.combo - 1) * 2
          s.pops.push({ x: cx, y: catchY - 20, text: `+${10 + (s.combo - 1) * 2}`, color: STATES[c.kind].color, life: 1 })
          chime([STATES[c.kind].chord[s.combo % STATES[c.kind].chord.length]], 0.05, 0.5)
        } else {
          s.combo = 0
          s.lives--
          setLives(s.lives)
          s.pops.push({ x: cx, y: catchY - 20, text: `Not ${c.kind}`, color: '#c2356a', life: 1 })
          chime([220, 233], 0.05, 0.5)
          if (s.lives <= 0) {
            s.phase = 'over'
            setBest(saveBest(ID, s.score))
            setPhase('over')
          }
        }
        setScore(s.score)
        continue
      }
      if (c.y > h + R * 2) {
        s.coins.splice(i, 1)
        continue
      }
      const col = STATES[c.kind].color
      glow(ctx, cx, c.y, R * 2.2, rgba(col, 0.28))
      const gr = ctx.createRadialGradient(cx - R * 0.35, c.y - R * 0.35, R * 0.1, cx, c.y, R)
      gr.addColorStop(0, '#fff')
      gr.addColorStop(0.35, rgba(col, 0.85))
      gr.addColorStop(1, col)
      ctx.fillStyle = gr
      ctx.beginPath()
      ctx.arc(cx, c.y, R, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = font(700, R * 0.9)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(c.kind[0], cx, c.y + 1)
    }

    /* catcher: glass pill with the called colour glowing inside */
    const callCol = STATES[s.call].color
    glow(ctx, padX + padW / 2, catchY + 7, padW * 0.8, rgba(callCol, 0.25 + s.flash * 0.3))
    ctx.save()
    ctx.shadowColor = 'rgba(60,74,158,0.3)'
    ctx.shadowBlur = 16
    ctx.fillStyle = ribbonGradient(ctx, padX, catchY, padX + padW, catchY + 14)
    ctx.beginPath()
    ctx.roundRect(padX, catchY, padW, 14, 7)
    ctx.fill()
    ctx.restore()
    ctx.fillStyle = callCol
    ctx.beginPath()
    ctx.roundRect(padX + 8, catchY + 4, padW - 16, 6, 3)
    ctx.fill()

    /* Ray's call, top centre */
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    drawRayMark(ctx, w / 2 - 80, 44, 18, t)
    ctx.fillStyle = callCol
    ctx.font = font(600, 22 + s.flash * 6)
    ctx.fillText(`Catch ${s.call}!`, w / 2 + 12, 45)
    ctx.fillStyle = 'rgba(14,20,40,0.08)'
    ctx.fillRect(w / 2 - 70, 64, 140, 3)
    ctx.fillStyle = callCol
    ctx.fillRect(w / 2 - 70, 64, 140 * (s.callT / CALL_EVERY), 3)

    for (let i = s.pops.length - 1; i >= 0; i--) {
      const p = s.pops[i]
      p.life -= dt * 1.5
      p.y -= 30 * dt
      if (p.life <= 0) {
        s.pops.splice(i, 1)
        continue
      }
      ctx.globalAlpha = p.life
      ctx.fillStyle = p.color
      ctx.font = font(600, 15)
      ctx.fillText(p.text, p.x, p.y)
    }
    ctx.globalAlpha = 1
  })

  return (
    <Stage
      score={score}
      best={best}
      extra={[
        { label: 'Lives', value: '●'.repeat(Math.max(lives, 0)) + '○'.repeat(LIVES - Math.max(lives, 0)) },
        { label: 'Ray says', value: call },
      ]}
      hint="Move the pointer to catch"
      overlay={
        phase === 'ready'
          ? { title: 'Caustic Catch', body: 'Coins in the four state colours drift through the light. Catch only the one Ray calls — it changes every few seconds. Wrong colour costs a life.', action: 'Play', onAction: start }
          : phase === 'over'
            ? { title: `${score} points`, body: score >= best && score > 0 ? 'New best.' : 'Three wrong catches.', action: 'Play again', onAction: start }
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
