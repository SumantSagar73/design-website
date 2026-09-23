import { useCallback, useEffect, useRef, useState } from 'react'

import Stage from './Stage'
import { STATES, STATE_KEYS, chime, readBest, saveBest, type StateKey } from './kit'

const ID = 'mood-match'
const ROUNDS = 12

/* The four states, as the Try OrbitSense section defines them. */
const MEANING: Record<StateKey, string> = {
  Calm: 'Everything is under control.',
  Active: 'As you move forward.',
  Alert: 'Something needs action.',
  Resolve: 'Upon reaching a conclusion.',
}

const SCENARIOS: { text: string; state: StateKey }[] = [
  { text: 'All settlements are up to date.', state: 'Calm' },
  { text: 'No pending actions today.', state: 'Calm' },
  { text: 'Your dashboard is all caught up.', state: 'Calm' },
  { text: 'Auto-reconcile ran without issues.', state: 'Calm' },
  { text: 'Ray is drafting your integration…', state: 'Active' },
  { text: 'A customer is chatting with support.', state: 'Active' },
  { text: 'Generating your Replit prompt…', state: 'Active' },
  { text: 'Syncing payments from the last hour…', state: 'Active' },
  { text: 'Payment failed: card declined.', state: 'Alert' },
  { text: 'A KYC document is missing.', state: 'Alert' },
  { text: 'Your API key expires in 2 days.', state: 'Alert' },
  { text: 'A refund request needs approval.', state: 'Alert' },
  { text: 'Invoice #2041 paid in full.', state: 'Resolve' },
  { text: 'Onboarding complete.', state: 'Resolve' },
  { text: 'Payout of ₹48,000 settled.', state: 'Resolve' },
  { text: 'Integration test passed.', state: 'Resolve' },
]

const shuffle = <T,>(a: T[]) => {
  const b = [...a]
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[b[i], b[j]] = [b[j], b[i]]
  }
  return b
}

export default function MoodMatch() {
  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready')
  const [deck, setDeck] = useState(() => shuffle(SCENARIOS).slice(0, ROUNDS))
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(() => readBest(ID))
  const [shown, setShown] = useState<StateKey>('Calm') // what the rings currently express
  const [verdict, setVerdict] = useState<null | { ok: boolean; picked: StateKey }>(null)
  const [timeLeft, setTimeLeft] = useState(1)
  const timer = useRef(0)

  const limit = Math.max(2.2, 5 - round * 0.2) // seconds per card, tightening

  const start = () => {
    setDeck(shuffle(SCENARIOS).slice(0, ROUNDS))
    setRound(0)
    setScore(0)
    setStreak(0)
    setVerdict(null)
    setShown('Calm')
    setPhase('play')
  }

  const answer = useCallback(
    (picked: StateKey | null) => {
      if (phase !== 'play' || verdict) return
      const card = deck[round]
      const ok = picked === card.state
      setShown(card.state)
      setVerdict({ ok, picked: picked ?? card.state })
      chime(ok ? STATES[card.state].chord : [220, 233], ok ? 0.06 : 0.05, ok ? 1.2 : 0.5)
      const nextStreak = ok ? streak + 1 : 0
      const nextScore = ok ? score + 10 + streak * 5 : score
      setStreak(nextStreak)
      setScore(nextScore)
      window.setTimeout(() => {
        setVerdict(null)
        if (round + 1 >= ROUNDS) {
          setBest(saveBest(ID, nextScore))
          setPhase('over')
        } else {
          setRound(round + 1)
        }
      }, 1100)
    },
    [phase, verdict, deck, round, streak, score],
  )

  /* Per-card countdown; running out counts as a miss. */
  useEffect(() => {
    if (phase !== 'play' || verdict) return
    const t0 = performance.now()
    const tick = () => {
      const left = 1 - (performance.now() - t0) / 1000 / limit
      setTimeLeft(Math.max(0, left))
      if (left <= 0) answer(null)
      else timer.current = requestAnimationFrame(tick)
    }
    timer.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(timer.current)
  }, [phase, verdict, round, limit, answer])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const i = ['1', '2', '3', '4'].indexOf(e.key)
      if (i >= 0) answer(STATE_KEYS[i])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [answer])

  const st = STATES[shown]
  const card = deck[round]

  return (
    <Stage
      score={score}
      best={best}
      extra={[
        { label: 'Card', value: `${Math.min(round + 1, ROUNDS)}/${ROUNDS}` },
        { label: 'Streak', value: streak },
      ]}
      hint="Click a state · or keys 1–4"
      overlay={
        phase === 'ready'
          ? { title: 'Mood Match', body: 'Ray shows you a moment. Pick the MyOrbit state it should feel like — Calm, Active, Alert or Resolve. Streaks multiply.', action: 'Play', onAction: start }
          : phase === 'over'
            ? { title: `${score} points`, body: score >= best && score > 0 ? 'New best. You speak MyOrbit.' : 'Every state a feeling — try again.', action: 'Play again', onAction: start }
            : null
      }
    >
      <div className="mood" style={{ ['--mood' as string]: st.color, ['--mood-soft' as string]: st.soft }}>
        <div className="mood__rings" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={`${shown}-${i}`}
              className="mood__ring"
              style={{
                width: `${22 + i * 15}vmin`,
                height: `${22 + i * 15}vmin`,
                animationDuration: `${3.2 / st.tempo}s`,
                animationDelay: `${(i * 0.4) / st.tempo}s`,
                opacity: 0.55 - i * 0.09,
              }}
            />
          ))}
        </div>

        {phase === 'play' && card && (
          <div className="mood__card" key={round}>
            <div className="mood__from">
              <span className="mood__ray" aria-hidden="true" />
              Ray
            </div>
            <p className="mood__text">{card.text}</p>
            <div className="mood__timer">
              <span style={{ transform: `scaleX(${timeLeft})` }} />
            </div>
            {verdict && (
              <p className={`mood__verdict ${verdict.ok ? 'is-ok' : 'is-miss'}`}>
                {verdict.ok ? `${card.state} — ${MEANING[card.state]}` : `It’s ${card.state}: ${MEANING[card.state]}`}
              </p>
            )}
          </div>
        )}

        <div className="mood__choices">
          {STATE_KEYS.map((k, i) => (
            <button
              key={k}
              type="button"
              className={`mood__choice ${verdict && k === deck[round]?.state ? 'is-right' : ''} ${verdict && !verdict.ok && k === verdict.picked ? 'is-wrong' : ''}`}
              style={{ ['--c' as string]: STATES[k].color }}
              onClick={() => answer(k)}
              disabled={phase !== 'play' || !!verdict}
            >
              <span className="mood__key">{i + 1}</span>
              {k}
            </button>
          ))}
        </div>
      </div>
    </Stage>
  )
}
