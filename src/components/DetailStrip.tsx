import { useEffect, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const EASE = [0.22, 1, 0.36, 1] as const

/* Tiles are authored at the Figma frame's native pixel size (392 × 430) and
   the whole rail is scaled down by CSS, so every inner offset below can stay
   at the exact value the design specifies. */

/** Decorative blurred ellipses bled off each tile's edges. */
type Blob = { src: string; x: number; y: number; w: number; h: number }

function Blobs({ items }: { items: Blob[] }) {
  return (
    <>
      {items.map((b) => (
        <img
          key={`${b.src}-${b.x}-${b.y}`}
          className="ds-blob"
          src={b.src}
          width={b.w}
          height={b.h}
          style={{ left: b.x, top: b.y }}
          alt=""
          aria-hidden="true"
        />
      ))}
    </>
  )
}

/* The wide gradient wash every tile carries across its top edge. */
const WASH: Blob = { src: '/ds/d655f.svg', x: 71, y: -171, w: 520, h: 420 }
const WASH_WARM: Blob = { src: '/ds/c0cdf.svg', x: 71, y: -171, w: 520, h: 420 }

/* ------------------------------------------------------------------ 01 Button */

function ButtonTile() {
  /* Six verticals / seven horizontals on a 56px blueprint pitch. */
  const cols = [55, 111, 167, 223, 279, 335]
  const rows = [55, 111, 167, 223, 279, 335, 391]
  const marks = [
    [36, 142],
    [354, 142],
    [36, 273],
    [354, 273],
  ]

  return (
    <>
      {cols.map((x) => (
        <span key={`c${x}`} className="ds-grid-v" style={{ left: x }} />
      ))}
      {rows.map((y) => (
        <span key={`r${y}`} className="ds-grid-h" style={{ top: y }} />
      ))}

      {marks.map(([x, y]) => (
        <span key={`m${x}-${y}`} className="ds-mark" style={{ left: x - 7, top: y }} />
      ))}

      <div className="ds-btn-primary">
        <img className="ds-btn-primary__icon" src="/ds/ac362.svg" width={19} height={19} alt="" />
        <span>Create Campaign</span>
      </div>
    </>
  )
}

/* ------------------------------------------------------------- 02 Loading states */

function LoadingTile() {
  return (
    <div className="ds-card ds-card--loading">
      <div className="ds-card__head">
        <p className="ds-card__title">Fetching call logs…</p>
        <p className="ds-card__sub">Skeleton first, spinner for the tail.</p>
      </div>

      <div className="ds-skeleton-wrap">
        <div className="ds-skeleton-layout">
          <span className="ds-sk ds-sk--hero" />
          <div className="ds-sk-stack">
            <span className="ds-sk" style={{ width: 161.823 }} />
            <span className="ds-sk" style={{ width: '100%' }} />
            <span className="ds-sk" style={{ width: 215.764 }} />
          </div>
        </div>
        <img
          className="ds-spinner"
          src="/ds/9adb3.svg"
          width={43.5764}
          height={43.1528}
          alt=""
          aria-hidden="true"
        />
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- 03 Upload file */

/** Walks an upload from 0 → 100 %, holds a beat, then starts over. */
function useUploadProgress(active: boolean) {
  const [pct, setPct] = useState(20)
  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => {
      setPct((p) => (p >= 100 ? 0 : Math.min(100, p + 2)))
    }, 110)
    return () => window.clearInterval(id)
  }, [active])
  return pct
}

function UploadTile({ animate }: { animate: boolean }) {
  const pct = useUploadProgress(animate)
  /* Roughly 15 s for a full bar, so the countdown tracks what the bar shows. */
  const secondsLeft = Math.max(1, Math.round(((100 - pct) / 100) * 15))

  return (
    <div className="ds-card ds-card--upload">
      <div className="ds-card__head">
        <p className="ds-card__title">Importing your contacts</p>
        <p className="ds-card__sub">contacts-list.csv · 2.4 MB</p>
      </div>

      <div className="ds-uploader">
        <div className="ds-uploader__head">
          <span className="ds-uploader__label">Upload File</span>
          <span className="ds-uploader__sample">
            <img src="/ds/905a6.svg" width={14.4646} height={14.4646} alt="" />
            Download Sample File
          </span>
        </div>

        <div className="ds-dropzone">
          <span className="ds-dropzone__btn">Upload from device</span>
          <span className="ds-dropzone__or">OR</span>
          <span className="ds-dropzone__desc">
            <span className="ds-dropzone__drag">Drag and drop a file here</span>
            <span className="ds-dropzone__formats">
              Max file size: 100 MB (Supported formats: .doc,.docx,.pdf,.csv,.xls,.xlsx,.txt)
            </span>
          </span>
        </div>

        <div className="ds-uploader__files">
          <div className="ds-file">
            <div className="ds-file__row">
              <span className="ds-file__desc">
                <span className="ds-file__name">Tutorial.pdf</span>
                <span className="ds-file__meta">
                  {pct}% • {secondsLeft} seconds remaining
                </span>
              </span>
              <img
                className="ds-file__x"
                src="/ds/ca9ca.svg"
                width={19.2862}
                height={19.2862}
                alt=""
              />
            </div>
            <div className="ds-progressbar">
              <span className="ds-progressbar__fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ 04 Progress */

/* Track geometry lifted straight from the design's ring asset. */
const R = 72.5
const CIRC = 2 * Math.PI * R

function ProgressTile({ animate }: { animate: boolean }) {
  const [pct, setPct] = useState(animate ? 0 : 70)

  /* Ease up to 70 %, rest, drop back — so the ring is always mid-story. */
  useEffect(() => {
    if (!animate) return
    let frame = 0
    const id = window.setInterval(() => {
      frame = (frame + 1) % 90
      setPct(frame < 55 ? Math.round((frame / 55) * 70) : 70)
    }, 40)
    return () => window.clearInterval(id)
  }, [animate])

  return (
    <div className="ds-quota">
      <p className="ds-quota__title">Monthly call quota</p>
      <p className="ds-quota__sub">70% of 10,000 minutes used.</p>

      <div className="ds-ring">
        <img className="ds-ring__track" src="/ds/f7169.svg" width={160} height={160} alt="" />
        <svg className="ds-ring__arc" viewBox="0 0 160 160" width={160} height={160} aria-hidden="true">
          <circle
            cx="80"
            cy="80"
            r={R}
            fill="none"
            stroke="#4275D6"
            strokeWidth="15"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - pct / 100)}
          />
        </svg>
        <span className="ds-ring__value">{pct}%</span>
      </div>
    </div>
  )
}

/* --------------------------------------------------------------- 05 Empty state */

function EmptyTile() {
  return (
    <div className="ds-card ds-card--empty">
      <div className="ds-card__head">
        <p className="ds-card__title">No campaign yet</p>
        <p className="ds-card__sub">Need to create one</p>
      </div>

      <div className="ds-empty">
        <div className="ds-empty__bg">
          <img src="/ds/e61a9.svg" width={297.805} height={297.805} alt="" />
          <img className="ds-empty__bg-rot" src="/ds/1cd62.svg" width={297.805} height={297.805} alt="" />
        </div>

        <div className="ds-empty__avatar">
          <img
            className="ds-empty__avatar-icon"
            src="/ds/d24aa.svg"
            width={44.6707}
            height={44.6707}
            alt=""
          />
        </div>

        <div className="ds-empty__copy">
          <p className="ds-empty__title">No campaign yet</p>
          <p className="ds-empty__desc">Create your first campaign to start reaching your customers.</p>
        </div>

        <div className="ds-empty__btn">
          <img src="/ds/4abe0.svg" width={14.8902} height={14.8902} alt="" />
          Create Campaign
        </div>
      </div>
    </div>
  )
}

/* --------------------------------------------------------------------- 06 Toast */

function ToastTile() {
  return (
    <div className="ds-card ds-card--toast">
      <div className="ds-card__head">
        <p className="ds-card__title">Campaign scheduled</p>
        <p className="ds-card__sub">IVR:Department Connect</p>
      </div>

      {/* Re-enters on a CSS loop, so the tile always catches the arrival. */}
      <div className="ds-toast">
        <div className="ds-toast__head">
          <img src="/ds/22a05.svg" width={21.3876} height={21.3876} alt="" />
          <p>"Summer Promo Blast" Campaign Enabled Successfully!</p>
        </div>
        <div className="ds-toast__body">
          <p>Campaign schedule at 4:00 PM</p>
          <span className="ds-toast__close">Close</span>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------- 07 Stepper */

const STEPS = [
  { title: 'Your details', desc: 'Please provide your name and email' },
  { title: 'Company details', desc: 'A few details about your company' },
  { title: 'Invite your team', desc: 'Start collaborating with your team' },
  { title: 'Add your socials', desc: 'Share posts to your social accounts' },
]

function StepperTile({ animate }: { animate: boolean }) {
  /* Design ships step 2 as current; the loop walks the whole flow. */
  const [current, setCurrent] = useState(1)
  useEffect(() => {
    if (!animate) return
    const id = window.setInterval(() => setCurrent((c) => (c + 1) % (STEPS.length + 1)), 1600)
    return () => window.clearInterval(id)
  }, [animate])

  return (
    <div className="ds-stepper">
      {STEPS.map((step, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'todo'
        return (
          <div key={step.title} className={`ds-step is-${state}`}>
            <div className="ds-step__rail">
              <span className="ds-step__dot">
                {state === 'done' && (
                  <img src="/ds/b466a.svg" width={17.7723} height={17.7723} alt="" />
                )}
              </span>
              {i < STEPS.length - 1 && <span className="ds-step__line" />}
            </div>
            <div className="ds-step__text">
              <p className="ds-step__title">{step.title}</p>
              <p className="ds-step__desc">{step.desc}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ---------------------------------------------------------------------- Tiles */

type TileSpec = { n: string; label: string; blobs: Blob[]; body: ReactNode }

function tiles(animate: boolean): TileSpec[] {
  return [
    {
      n: '01',
      label: 'BUTTON',
      blobs: [{ src: '/ds/a0ef7.svg', x: -54, y: 296, w: 176, h: 176 }, WASH],
      body: <ButtonTile />,
    },
    {
      n: '02',
      label: 'LOADING STATES',
      blobs: [
        { src: '/ds/aac22.svg', x: 238, y: -64, w: 226, h: 226 },
        { src: '/ds/fd231.svg', x: -34, y: 336, w: 126, h: 126 },
        WASH,
      ],
      body: <LoadingTile />,
    },
    {
      n: '03',
      label: 'UPLOAD FILE',
      blobs: [
        { src: '/ds/7a1a9.svg', x: -84, y: -74, w: 246, h: 246 },
        { src: '/ds/4991e.svg', x: 302, y: 340, w: 116, h: 116 },
        WASH,
      ],
      body: <UploadTile animate={animate} />,
    },
    {
      n: '04',
      label: 'PROGRESS',
      blobs: [
        { src: '/ds/1b049.svg', x: 248, y: 276, w: 206, h: 206 },
        { src: '/ds/4276f.svg', x: -30, y: 36, w: 102, h: 102 },
        WASH,
      ],
      body: <ProgressTile animate={animate} />,
    },
    {
      n: '05',
      label: 'EMPTY STATE',
      blobs: [
        { src: '/ds/22157.svg', x: -74, y: 266, w: 236, h: 236 },
        { src: '/ds/a7f88.svg', x: 312, y: -28, w: 110, h: 110 },
        WASH_WARM,
      ],
      body: <EmptyTile />,
    },
    {
      n: '06',
      label: 'TOAST',
      blobs: [
        { src: '/ds/54905.svg', x: 242, y: -60, w: 216, h: 216 },
        { src: '/ds/1ab3c.svg', x: -34, y: 342, w: 116, h: 116 },
        WASH,
      ],
      body: <ToastTile />,
    },
    {
      n: '07',
      label: 'STEPPER',
      blobs: [
        { src: '/ds/aac22.svg', x: -70, y: -64, w: 226, h: 226 },
        { src: '/ds/25584.svg', x: 306, y: 344, w: 118, h: 118 },
        WASH,
      ],
      body: <StepperTile animate={animate} />,
    },
  ]
}

/* ---------------------------------------------------------------------- Strip */

export default function DetailStrip() {
  const reduced = useReducedMotion()
  const animate = !reduced
  const set = tiles(animate)

  return (
    <div className="ds-block">
      <div className="ds-masthead">
        <motion.p
          className="ds-eyebrow"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          MYOPERATOR DESIGN SYSTEM
        </motion.p>
        <motion.h2
          className="ds-title"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.85, ease: EASE, delay: 0.08 }}
        >
          Components, where they actually live.
        </motion.h2>
      </div>

      <motion.div
        className="ds-viewport"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.9, ease: EASE }}
      >
        <div className="ds-scaler">
          {/* Two copies back to back; the rail slides by exactly one copy and
              restarts, so the drift reads as endless. */}
          <div className="ds-rail">
            {[0, 1].map((copy) =>
              set.map((tile) => (
                <article
                  key={`${copy}-${tile.n}`}
                  className={`ds-tile ds-tile--${tile.n}`}
                  aria-hidden={copy === 1 ? true : undefined}
                >
                  <Blobs items={tile.blobs} />
                  <span className="ds-chip">{tile.label}</span>
                  {tile.body}
                </article>
              )),
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
