import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
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

type BtnPhase = 'idle' | 'busy' | 'done'

function ButtonTile() {
  const [phase, setPhase] = useState<BtnPhase>('idle')

  /* Runs the button through its real states, then hands it back. */
  useEffect(() => {
    if (phase === 'idle') return
    const ms = phase === 'busy' ? 1100 : 1500
    const id = window.setTimeout(() => setPhase(phase === 'busy' ? 'done' : 'idle'), ms)
    return () => window.clearTimeout(id)
  }, [phase])

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

      <button
        type="button"
        className={`ds-btn-primary is-${phase}`}
        onClick={() => phase === 'idle' && setPhase('busy')}
      >
        {phase === 'busy' ? (
          <span className="ds-btn-primary__spin" aria-hidden="true" />
        ) : (
          <img
            className="ds-btn-primary__icon"
            src={phase === 'done' ? '/ds/b466a.svg' : '/ds/ac362.svg'}
            width={19}
            height={19}
            alt=""
          />
        )}
        <span>
          {phase === 'busy' ? 'Creating…' : phase === 'done' ? 'Campaign created' : 'Create Campaign'}
        </span>
      </button>
    </>
  )
}

/* ------------------------------------------------------------- 02 Loading states */

const CALL_ROWS = [
  { who: 'Sales · IVR', dur: '4m 12s' },
  { who: 'Support queue', dur: '2m 05s' },
  { who: 'Priya Nair', dur: '8m 47s' },
  { who: 'Missed · +91 98…', dur: '—' },
]

function LoadingTile() {
  const [loaded, setLoaded] = useState(false)

  /* Click resolves the skeleton; clicking again puts it back to loading. */
  const toggle = () => setLoaded((v) => !v)

  return (
    <button
      type="button"
      className={`ds-card ds-card--loading ${loaded ? 'is-loaded' : ''}`}
      onClick={toggle}
      aria-label={loaded ? 'Reload call logs' : 'Finish loading call logs'}
    >
      <span className="ds-card__head">
        <span className="ds-card__title">{loaded ? 'Call logs' : 'Fetching call logs…'}</span>
        <span className="ds-card__sub">
          {loaded ? 'Loaded in 240ms — tap to replay.' : 'Skeleton first, spinner for the tail.'}
        </span>
      </span>

      <span className="ds-skeleton-wrap">
        <span className="ds-skeleton-layout">
          {loaded ? (
            <span className="ds-loaded__panel">
              {CALL_ROWS.map((r) => (
                <span key={r.who} className="ds-loaded__row">
                  <span>{r.who}</span>
                  <span className="ds-loaded__dur">{r.dur}</span>
                </span>
              ))}
            </span>
          ) : (
            <span className="ds-sk ds-sk--hero" />
          )}

          <span className="ds-sk-stack">
            {loaded ? (
              <>
                <span className="ds-loaded__line">Total calls today — 128</span>
                <span className="ds-loaded__line">Answered 114 · Missed 14</span>
                <span className="ds-loaded__line">Avg. handle time 3m 42s</span>
              </>
            ) : (
              <>
                <span className="ds-sk" style={{ width: 161.823 }} />
                <span className="ds-sk" style={{ width: '100%' }} />
                <span className="ds-sk" style={{ width: 215.764 }} />
              </>
            )}
          </span>
        </span>

        {!loaded && (
          <img
            className="ds-spinner"
            src="/ds/9adb3.svg"
            width={43.5764}
            height={43.1528}
            alt=""
            aria-hidden="true"
          />
        )}
      </span>
    </button>
  )
}

/* ---------------------------------------------------------------- 03 Upload file */

type UploadMode = 'loop' | 'run' | 'done' | 'empty'

function UploadTile({ animate }: { animate: boolean }) {
  const [pct, setPct] = useState(20)
  const [mode, setMode] = useState<UploadMode>(animate ? 'loop' : 'done')

  /* Idles on a loop until someone drives it, then it runs once and settles. */
  useEffect(() => {
    if (mode !== 'loop' && mode !== 'run') return
    const id = window.setInterval(() => {
      setPct((p) => {
        if (p < 100) return Math.min(100, p + 2)
        if (mode === 'run') {
          setMode('done')
          return 100
        }
        return 0
      })
    }, 110)
    return () => window.clearInterval(id)
  }, [mode])

  /* Roughly 15 s for a full bar, so the countdown tracks what the bar shows. */
  const secondsLeft = Math.max(1, Math.round(((100 - pct) / 100) * 15))

  const start = () => {
    setPct(0)
    setMode('run')
  }

  return (
    <div className="ds-card ds-card--upload">
      <div className="ds-card__head">
        <p className="ds-card__title">Importing your contacts</p>
        <p className="ds-card__sub">contacts-list.csv · 2.4 MB</p>
      </div>

      <div className="ds-uploader">
        <div className="ds-uploader__head">
          <span className="ds-uploader__label">Upload File</span>
          <button type="button" className="ds-uploader__sample" onClick={start}>
            <img src="/ds/905a6.svg" width={14.4646} height={14.4646} alt="" />
            Download Sample File
          </button>
        </div>

        <div className="ds-dropzone">
          <button type="button" className="ds-dropzone__btn" onClick={start}>
            Upload from device
          </button>
          <span className="ds-dropzone__or">OR</span>
          <span className="ds-dropzone__desc">
            <span className="ds-dropzone__drag">Drag and drop a file here</span>
            <span className="ds-dropzone__formats">
              Max file size: 100 MB (Supported formats: .doc,.docx,.pdf,.csv,.xls,.xlsx,.txt)
            </span>
          </span>
        </div>

        <div className="ds-uploader__files">
          {mode === 'empty' ? (
            <button type="button" className="ds-file ds-file--empty" onClick={start}>
              No file yet — start an upload
            </button>
          ) : (
            <div className="ds-file">
              <div className="ds-file__row">
                <span className="ds-file__desc">
                  <span className="ds-file__name">Tutorial.pdf</span>
                  <span className="ds-file__meta">
                    {mode === 'done'
                      ? 'Upload complete · 2.4 MB'
                      : `${pct}% • ${secondsLeft} second${secondsLeft === 1 ? '' : 's'} remaining`}
                  </span>
                </span>
                <button
                  type="button"
                  className="ds-file__x"
                  onClick={() => {
                    setMode('empty')
                    setPct(0)
                  }}
                  aria-label="Cancel upload"
                >
                  <img src="/ds/ca9ca.svg" width={19.2862} height={19.2862} alt="" />
                </button>
              </div>
              <div className="ds-progressbar">
                <span
                  className={`ds-progressbar__fill ${mode === 'done' ? 'is-done' : ''}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}
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
  const [run, setRun] = useState(0)

  /* Ease up to 70 %, then hold. The replay button does the resetting, so the
     effect only ever owns the interval. */
  useEffect(() => {
    if (!animate) return
    let frame = 0
    const id = window.setInterval(() => {
      frame += 1
      if (frame >= 55) {
        setPct(70)
        window.clearInterval(id)
        return
      }
      setPct(Math.round((frame / 55) * 70))
    }, 24)
    return () => window.clearInterval(id)
  }, [animate, run])

  return (
    <div className="ds-quota">
      <p className="ds-quota__title">Monthly call quota</p>
      <p className="ds-quota__sub">70% of 10,000 minutes used.</p>

      <button
        type="button"
        className="ds-ring"
        onClick={() => {
          setPct(0)
          setRun((r) => r + 1)
        }}
        aria-label="Replay quota animation"
      >
        <img className="ds-ring__track" src="/ds/f7169.svg" width={160} height={160} alt="" />
        <svg
          className="ds-ring__arc"
          viewBox="0 0 160 160"
          width={160}
          height={160}
          aria-hidden="true"
        >
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
      </button>
    </div>
  )
}

/* --------------------------------------------------------------- 05 Empty state */

function EmptyTile() {
  const [created, setCreated] = useState(false)

  return (
    <div className="ds-card ds-card--empty">
      <div className="ds-card__head">
        <p className="ds-card__title">{created ? 'Summer Promo Blast' : 'No campaign yet'}</p>
        <p className="ds-card__sub">{created ? 'Scheduled · 4:00 PM' : 'Need to create one'}</p>
      </div>

      <div className="ds-empty">
        <div className="ds-empty__bg">
          <img src="/ds/e61a9.svg" width={297.805} height={297.805} alt="" />
          <img
            className="ds-empty__bg-rot"
            src="/ds/1cd62.svg"
            width={297.805}
            height={297.805}
            alt=""
          />
        </div>

        <div className="ds-empty__avatar">
          <img
            className="ds-empty__avatar-icon"
            src={created ? '/ds/22a05.svg' : '/ds/d24aa.svg'}
            width={44.6707}
            height={44.6707}
            alt=""
          />
        </div>

        <div className="ds-empty__copy">
          <p className="ds-empty__title">{created ? 'Campaign created' : 'No campaign yet'}</p>
          <p className="ds-empty__desc">
            {created
              ? 'Reaching 4,820 contacts across IVR and WhatsApp.'
              : 'Create your first campaign to start reaching your customers.'}
          </p>
        </div>

        <button
          type="button"
          className={`ds-empty__btn ${created ? 'is-ghost' : ''}`}
          onClick={() => setCreated((v) => !v)}
        >
          {!created && <img src="/ds/4abe0.svg" width={14.8902} height={14.8902} alt="" />}
          {created ? 'Start over' : 'Create Campaign'}
        </button>
      </div>
    </div>
  )
}

/* --------------------------------------------------------------------- 06 Toast */

function ToastTile() {
  const [dismissed, setDismissed] = useState(false)

  /* Closing it feels real, then the tile heals so it stays demonstrable. */
  useEffect(() => {
    if (!dismissed) return
    const id = window.setTimeout(() => setDismissed(false), 1800)
    return () => window.clearTimeout(id)
  }, [dismissed])

  return (
    <div className="ds-card ds-card--toast">
      <div className="ds-card__head">
        <p className="ds-card__title">Campaign scheduled</p>
        <p className="ds-card__sub">IVR:Department Connect</p>
      </div>

      {/* Re-enters on a CSS loop, so the tile always catches the arrival. */}
      <div className={`ds-toast ${dismissed ? 'is-dismissed' : ''}`}>
        <div className="ds-toast__head">
          <img src="/ds/22a05.svg" width={21.3876} height={21.3876} alt="" />
          <p>"Summer Promo Blast" Campaign Enabled Successfully!</p>
        </div>
        <div className="ds-toast__body">
          <p>Campaign schedule at 4:00 PM</p>
          <button type="button" className="ds-toast__close" onClick={() => setDismissed(true)}>
            Close
          </button>
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
  const [manual, setManual] = useState(false)

  useEffect(() => {
    if (!animate || manual) return
    const id = window.setInterval(() => setCurrent((c) => (c + 1) % (STEPS.length + 1)), 1600)
    return () => window.clearInterval(id)
  }, [animate, manual])

  /* Hand the flow back to the idle walk once they stop clicking. */
  useEffect(() => {
    if (!manual) return
    const id = window.setTimeout(() => setManual(false), 6000)
    return () => window.clearTimeout(id)
  }, [manual, current])

  return (
    <div className="ds-stepper">
      {STEPS.map((step, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'todo'
        return (
          <button
            type="button"
            key={step.title}
            className={`ds-step is-${state}`}
            onClick={() => {
              setManual(true)
              setCurrent(i)
            }}
          >
            <span className="ds-step__rail">
              <span className="ds-step__dot">
                {state === 'done' && (
                  <img src="/ds/b466a.svg" width={17.7723} height={17.7723} alt="" />
                )}
              </span>
              {i < STEPS.length - 1 && <span className="ds-step__line" />}
            </span>
            <span className="ds-step__text">
              <span className="ds-step__title">{step.title}</span>
              <span className="ds-step__desc">{step.desc}</span>
            </span>
          </button>
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

/* ------------------------------------------------------------------------ Rail */

/** On-screen drift, in px per millisecond. */
const DRIFT = 0.052
/** Past this much pointer travel a gesture is a drag, not a click. */
const DRAG_SLOP = 5

/**
 * Drives the rail: a steady leftward drift that the pointer can grab and
 * throw. The rail holds two copies of the tiles, so the offset wraps at one
 * copy's width and the loop never shows a seam.
 */
function useRail(enabled: boolean) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const railRef = useRef<HTMLDivElement>(null)
  const [grabbing, setGrabbing] = useState(false)

  const s = useRef({
    offset: 0,
    velocity: 0,
    span: 0,
    scale: 1,
    dragging: false,
    paused: false,
    lastX: 0,
    lastT: 0,
    travelled: 0,
  })

  useEffect(() => {
    const rail = railRef.current
    const viewport = viewportRef.current
    if (!rail || !viewport || !enabled) return

    const measure = () => {
      const raw = getComputedStyle(rail).getPropertyValue('--ds-scale').trim()
      const scale = Number.parseFloat(raw)
      s.current.scale = Number.isFinite(scale) && scale > 0 ? scale : 1
      /* Two copies, so one copy is half the track. */
      s.current.span = rail.scrollWidth / 2
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(rail)

    let raf = 0
    let prev = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(48, now - prev)
      prev = now
      const st = s.current

      if (!st.dragging) {
        if (Math.abs(st.velocity) > 0.004) {
          /* Throw decays back into the drift rather than stopping dead. */
          st.offset += st.velocity * dt
          st.velocity *= Math.pow(0.9, dt / 16)
        } else if (!st.paused) {
          st.offset -= (DRIFT / st.scale) * dt
        }
      }

      if (st.span > 0) {
        while (st.offset <= -st.span) st.offset += st.span
        while (st.offset > 0) st.offset -= st.span
      }
      rail.style.transform = `translate3d(${st.offset}px, 0, 0)`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [enabled])

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled || e.button !== 0) return
      const st = s.current
      st.dragging = true
      st.velocity = 0
      st.lastX = e.clientX
      st.lastT = performance.now()
      st.travelled = 0
      setGrabbing(true)
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    [enabled],
  )

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const st = s.current
    if (!st.dragging) return
    const now = performance.now()
    const dx = (e.clientX - st.lastX) / st.scale
    const dt = Math.max(1, now - st.lastT)
    st.offset += dx
    /* Blend so a single jittery sample can't fling the rail. */
    st.velocity = st.velocity * 0.7 + (dx / dt) * 0.3
    st.travelled += Math.abs(e.clientX - st.lastX)
    st.lastX = e.clientX
    st.lastT = now
  }, [])

  const endDrag = useCallback(() => {
    s.current.dragging = false
    setGrabbing(false)
  }, [])

  /* A gesture that moved is a drag: swallow the click it would otherwise
     land on whichever control happens to be under the pointer. */
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (s.current.travelled > DRAG_SLOP) {
      e.preventDefault()
      e.stopPropagation()
      s.current.travelled = 0
    }
  }, [])

  const setPaused = useCallback((v: boolean) => {
    s.current.paused = v
  }, [])

  /* The rail is transformed, not scrolled, so the browser cannot bring a
     focused control into view by itself — nudge the offset instead. */
  const revealFocus = useCallback((el: HTMLElement) => {
    const viewport = viewportRef.current
    if (!viewport) return
    const st = s.current
    const box = viewport.getBoundingClientRect()
    const target = el.getBoundingClientRect()
    const pad = 24
    let shift = 0
    if (target.left < box.left + pad) shift = box.left + pad - target.left
    else if (target.right > box.right - pad) shift = box.right - pad - target.right
    if (!shift) return
    st.offset += shift / st.scale
    st.velocity = 0
  }, [])

  return {
    viewportRef,
    railRef,
    grabbing,
    setPaused,
    revealFocus,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onClickCapture,
    },
  }
}

/* ---------------------------------------------------------------------- Strip */

export default function DetailStrip() {
  const reduced = useReducedMotion()
  const animate = !reduced
  const set = tiles(animate)
  const { viewportRef, railRef, grabbing, setPaused, revealFocus, handlers } = useRail(animate)

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
          Designed for clarity. Built to connect.
        </motion.h2>
        <motion.p
          className="ds-hint"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.24 }}
        >
          Drag the strip. Every component here is live — go ahead and use them.
        </motion.p>
      </div>

      <motion.div
        className={`ds-viewport ${grabbing ? 'is-grabbing' : ''}`}
        ref={viewportRef}
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.9, ease: EASE }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={(e) => {
          setPaused(true)
          revealFocus(e.target as HTMLElement)
        }}
        onBlurCapture={() => setPaused(false)}
        {...handlers}
      >
        <div className="ds-scaler">
          {/* Two copies back to back; the rail slides by exactly one copy and
              restarts, so the drift reads as endless. The trailing copy is
              inert so its controls stay out of the tab order. */}
          <div className="ds-rail" ref={railRef}>
            {[0, 1].map((copy) =>
              set.map((tile) => (
                <article
                  key={`${copy}-${tile.n}`}
                  className={`ds-tile ds-tile--${tile.n}`}
                  aria-hidden={copy === 1 ? true : undefined}
                  inert={copy === 1 ? true : undefined}
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
