import { useEffect, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ArrowUp } from 'lucide-react'

const EASE = [0.22, 1, 0.36, 1] as const

/** Ray's mark: four diamonds in a pinwheel. */
function RayMark({ size = 18, className }: { size?: number; className?: string }) {
  const id = `ray-${size}`
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1fd79a" />
          <stop offset="100%" stopColor="#3be3cf" />
        </linearGradient>
      </defs>
      <g fill={`url(#${id})`}>
        <path d="M12 0.5 L17 6.2 L12 12 L7 6.2 Z" />
        <path d="M23.5 12 L17.8 17 L12 12 L17.8 7 Z" />
        <path d="M12 23.5 L7 17.8 L12 12 L17 17.8 Z" />
        <path d="M0.5 12 L6.2 7 L12 12 L6.2 17 Z" />
      </g>
    </svg>
  )
}

function InvoiceTile() {
  return (
    <div className="detail-tile detail-invoice">
      <div className="detail-invoice__grid" />
      <button type="button" className="detail-invoice__btn" tabIndex={-1}>
        Create invoice
      </button>
    </div>
  )
}

function InsightsTile() {
  return (
    <div className="detail-tile detail-insights">
      <div className="detail-eyebrow">
        <RayMark size={18} />
        RAY INSIGHTS
      </div>
      <p className="detail-insights__text">
        <span className="detail-insights__hl">Payment has gone up by 12%</span> since the last month
      </p>
    </div>
  )
}

function SkeletonTile() {
  return (
    <div className="detail-tile detail-skeleton">
      <span className="sk sk--line" style={{ width: '80%' }} />
      <span className="sk sk--line" style={{ width: '60%' }} />
      <span className="sk sk--block" />
      <div className="sk-row">
        <span className="sk sk--block" />
        <span className="sk sk--block" />
      </div>
      <span className="sk sk--block" />
    </div>
  )
}

const STEPS = [
  'Setting up test API keys',
  'Generating your Replit integration prompt',
  'Initiating KYC verification',
]

function ThinkingTile() {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setStep((s) => (s + 1) % STEPS.length), 1800)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="detail-tile detail-thinking">
      <div className="detail-thinking__aurora" />
      <div className="detail-thinking__body">
        <div className="detail-thinking__title">
          <RayMark size={16} />
          Initiating Onboarding....
        </div>
        <ul className="detail-thinking__steps">
          {STEPS.map((s, i) => (
            <li key={s} className={i === step ? 'is-current' : i < step ? 'is-done' : ''}>
              <span className="detail-thinking__dot">{i === step ? '✦' : ''}</span>
              <span className="detail-thinking__label">{s}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function LoadingTile() {
  return (
    <div className="detail-tile detail-loading">
      <div className="detail-loading__streaks" />
      <RayMark size={112} className="detail-loading__mark" />
    </div>
  )
}

function PromptTile() {
  return (
    <div className="detail-tile detail-prompt">
      <div className="detail-prompt__box">
        <span className="detail-prompt__placeholder">
          Ask Ray anything<span className="detail-prompt__caret" />
        </span>
        <span className="detail-prompt__send">
          <ArrowUp size={16} />
        </span>
      </div>
    </div>
  )
}

type Item = { label: string; pos: 'high' | 'low'; tile: ReactNode }

/* Tiles alternate between sitting high (label above) and low (label below). */
const ITEMS: Item[] = [
  { label: 'Primary Button', pos: 'low', tile: <InvoiceTile /> },
  { label: 'Insights', pos: 'high', tile: <InsightsTile /> },
  { label: 'Skeleton Loader', pos: 'low', tile: <SkeletonTile /> },
  { label: 'Thinking State', pos: 'high', tile: <ThinkingTile /> },
  { label: 'Ray Loading', pos: 'low', tile: <LoadingTile /> },
  { label: 'Prompt Input', pos: 'high', tile: <PromptTile /> },
]

export default function DetailStrip() {
  return (
    <div className="detail-block">
      <motion.h2
        className="detail-title"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.8, ease: EASE }}
      >
        Every detail, deliberate.
      </motion.h2>

      <div className="detail-viewport">
        {/* Two copies back to back; the track slides by one copy's width and
            loops, so the strip reads as endless. */}
        <div className="detail-track">
          {[0, 1].map((copy) =>
            ITEMS.map((item) => (
              <div
                key={`${copy}-${item.label}`}
                className={`detail-item detail-item--${item.pos}`}
                aria-hidden={copy === 1 ? true : undefined}
              >
                <span className="detail-label">{item.label}</span>
                {item.tile}
              </div>
            )),
          )}
        </div>
      </div>
    </div>
  )
}
