import { useEffect, useRef, useState } from 'react'

import Stage from './Stage'
import { C, STATES, STATE_KEYS, chime, clamp, font, local, readBest, rgba, saveBest, useCanvasLoop, type StateKey } from './kit'

const ID = 'payment-rush'
const LIVES = 3

/* Everyday Razorpay moments and the state each one should feel like. */
const EVENTS: { title: string; meta: string; state: StateKey }[] = [
  { title: 'Settlement on schedule', meta: 'T+2 · ₹1,24,000', state: 'Calm' },
  { title: 'No disputes this week', meta: 'Risk · 0 open', state: 'Calm' },
  { title: 'Autopay mandates healthy', meta: 'Subscriptions · 412', state: 'Calm' },
  { title: 'Customer chatting', meta: 'Support · live', state: 'Active' },
  { title: 'Checkout in progress', meta: 'UPI · ₹2,499', state: 'Active' },
  { title: 'Payout processing', meta: 'IMPS · ₹18,000', state: 'Active' },
  { title: 'Payment failed', meta: 'Card declined · ₹899', state: 'Attention' },
  { title: 'Refund needs approval', meta: 'Order #7719 · ₹1,200', state: 'Attention' },
  { title: 'KYC document missing', meta: 'Onboarding · PAN', state: 'Attention' },
  { title: 'Chargeback raised', meta: 'Dispute · ₹4,300', state: 'Attention' },
  { title: 'Invoice paid', meta: 'INV-2041 · ₹56,000', state: 'Success' },
  { title: 'Payout settled', meta: 'Bank · ₹48,000', state: 'Success' },
  { title: 'Integration live', meta: 'API · test passed', state: 'Success' },
]

type Card = { e: (typeof EVENTS)[number]; y: number; lane: number; x: number }
type Pop = { x: number; y: number; text: string; color: string; life: number }

export default function PaymentRush() {
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(LIVES)
  const [best, setBest] = useState(() => readBest(ID))
  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready')
  const g = useRef({
    phase: 'ready' as 'ready' | 'play' | 'over',
    card: null as Card | null,
    queue: [] as (typeof EVENTS)[number][],
    lane: 1.5, // pointer target, as a lane position 0..3
    speed: 0,
    sorted: 0,
    score: 0,
    combo: 0,
    lives: LIVES,
    pops: [] as Pop[],
    flash: [0, 0, 0, 0],
  })

  const nextCard = () => {
    const s = g.current
    if (!s.queue.length) s.queue = [...EVENTS].sort(() => Math.random() - 0.5)
    s.card = { e: s.queue.pop()!, y: -60, lane: s.lane, x: s.lane }
  }

  const start = () => {
    Object.assign(g.current, { phase: 'play', card: null, queue: [], speed: 0, sorted: 0, score: 0, combo: 0, lives: LIVES, pops: [], flash: [0, 0, 0, 0] })
    nextCard()
    setScore(0)
    setLives(LIVES)
    setPhase('play')
  }

  /* keys 1–4 jump straight to a lane; arrows nudge */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = g.current
      const i = ['1', '2', '3', '4'].indexOf(e.key)
      if (i >= 0) s.lane = i
      if (e.code === 'ArrowLeft') s.lane = Math.max(0, Math.round(s.lane) - 1)
      if (e.code === 'ArrowRight') s.lane = Math.min(3, Math.round(s.lane) + 1)
      if (e.code === 'ArrowDown' && s.card) s.card.y += 200
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const canvas = useCanvasLoop(({ ctx, w, h, dt }) => {
    const s = g.current
    const laneTop = h * 0.74
    const laneW = w / 4
    const cardW = Math.min(260, laneW * 0.9)
    const cardH = 64
    s.flash = s.flash.map((f) => Math.max(0, f - dt * 2.5))

    /* lanes: one per state, colour-tinted bins along the bottom */
    STATE_KEYS.forEach((k, i) => {
      const st = STATES[k]
      const x = i * laneW
      const gr = ctx.createLinearGradient(0, laneTop, 0, h)
      gr.addColorStop(0, rgba(st.color, 0.04 + s.flash[i] * 0.25))
      gr.addColorStop(1, rgba(st.color, 0.16 + s.flash[i] * 0.3))
      ctx.fillStyle = gr
      ctx.fillRect(x + 6, laneTop, laneW - 12, h - laneTop - 6)
      ctx.fillStyle = st.color
      ctx.fillRect(x + 6, laneTop, laneW - 12, 3)
      ctx.font = font(600, 15)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(k, x + laneW / 2, laneTop + (h - laneTop) / 2 - 6)
      ctx.fillStyle = C.ink3
      ctx.font = font(500, 11)
      ctx.fillText(`key ${i + 1}`, x + laneW / 2, laneTop + (h - laneTop) / 2 + 14)
    })

    const c = s.card
    if (c && s.phase === 'play') {
      s.speed = h * (0.14 + s.sorted * 0.012)
      c.y += s.speed * dt
      c.lane = clamp(s.lane, 0, 3)
      c.x += (c.lane - c.x) * (1 - Math.exp(-dt * 14))
      /* guide line down to the lane it's heading for */
      const cx = (Math.round(c.x) + 0.5) * laneW
      ctx.strokeStyle = 'rgba(60,74,158,0.18)'
      ctx.setLineDash([3, 6])
      ctx.beginPath()
      ctx.moveTo(cx, c.y + cardH)
      ctx.lineTo(cx, laneTop)
      ctx.stroke()
      ctx.setLineDash([])

      if (c.y + cardH >= laneTop) {
        const lane = Math.round(c.x)
        const ok = STATE_KEYS[lane] === c.e.state
        s.flash[lane] = 1
        if (ok) {
          s.combo++
          s.sorted++
          s.score += 10 + (s.combo - 1) * 3
          s.pops.push({ x: cx, y: laneTop - 16, text: `+${10 + (s.combo - 1) * 3}`, color: STATES[c.e.state].color, life: 1 })
          chime(STATES[c.e.state].chord.slice(0, 2), 0.05, 0.6)
        } else {
          s.combo = 0
          s.lives--
          setLives(s.lives)
          s.pops.push({ x: cx, y: laneTop - 16, text: `That’s ${c.e.state}`, color: '#c2356a', life: 1.3 })
          chime([220, 233], 0.05, 0.5)
        }
        setScore(s.score)
        if (s.lives <= 0) {
          s.phase = 'over'
          s.card = null
          setBest(saveBest(ID, s.score))
          setPhase('over')
        } else nextCard()
      }
    }

    /* the falling event card */
    if (s.card) {
      const k = s.card
      const x = (k.x + 0.5) * laneW - cardW / 2
      ctx.save()
      ctx.shadowColor = 'rgba(25,42,86,0.18)'
      ctx.shadowBlur = 22
      ctx.shadowOffsetY = 8
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.roundRect(x, k.y, cardW, cardH, 14)
      ctx.fill()
      ctx.restore()
      ctx.strokeStyle = '#e6e9ef'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(x, k.y, cardW, cardH, 14)
      ctx.stroke()
      ctx.textAlign = 'left'
      ctx.textBaseline = 'alphabetic'
      ctx.fillStyle = C.ink
      ctx.font = font(600, 15)
      ctx.fillText(k.e.title, x + 16, k.y + 27)
      ctx.fillStyle = C.ink2
      ctx.font = font(500, 12.5)
      ctx.fillText(k.e.meta, x + 16, k.y + 47)
    }

    ctx.textAlign = 'center'
    for (let i = s.pops.length - 1; i >= 0; i--) {
      const p = s.pops[i]
      p.life -= dt * 1.4
      p.y -= 28 * dt
      if (p.life <= 0) {
        s.pops.splice(i, 1)
        continue
      }
      ctx.globalAlpha = Math.min(1, p.life)
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
      extra={[{ label: 'Lives', value: '●'.repeat(Math.max(lives, 0)) + '○'.repeat(LIVES - Math.max(lives, 0)) }]}
      hint="Pointer or keys 1–4 to pick a lane · ↓ to drop"
      overlay={
        phase === 'ready'
          ? { title: 'Payment Rush', body: 'Payments, refunds and payouts pour in. Steer each one into the state it should feel like before it lands. It gets faster.', action: 'Start the rush', onAction: start }
          : phase === 'over'
            ? { title: `${score} points`, body: `${g.current.sorted} events sorted.${score >= best && score > 0 ? ' New best.' : ''}`, action: 'Go again', onAction: start }
            : null
      }
    >
      <canvas
        ref={canvas}
        className="game-canvas"
        onPointerMove={(e) => {
          const q = local(e, e.currentTarget)
          const r = e.currentTarget.getBoundingClientRect()
          g.current.lane = clamp((q.x / r.width) * 4 - 0.5, 0, 3)
        }}
      />
    </Stage>
  )
}
