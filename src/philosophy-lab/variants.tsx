import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react'
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionStyle,
  type MotionValue,
} from 'framer-motion'

import AnimatedAtmosphere from '../hero-animated/AnimatedAtmosphere'
import '../hero-animated/hero-animated.css'

/* Same copy as the live section (src/components/DesignPhilosophy.tsx). */
export const TEXT =
  'Built for the Humans in the AI Era, RazorSense is a design language that gives every state a feeling, every interaction a pulse, and every action a reason to feel alive, expressive, and genuinely felt.'
const WORDS = TEXT.split(' ')
const N = WORDS.length

/** Scroll window for word i: starts in reading order, overlapping neighbours. */
const range = (i: number, spread = 1.2, span = 1): [number, number] => {
  const start = (i / N) * span
  return [start, Math.min(start + (spread / N) * span, 1)]
}

/** Same scroll window as the live section: enters at the bottom, done when centred. */
function useReveal(ref: RefObject<HTMLElement | null>) {
  return useScroll({ target: ref, offset: ['start end', 'center center'] }).scrollYProgress
}

function Frame({
  innerRef,
  children,
  className = '',
  style,
  after,
}: {
  innerRef?: RefObject<HTMLDivElement | null>
  children: ReactNode
  className?: string
  style?: CSSProperties
  after?: ReactNode
}) {
  return (
    <section className={`content-section philosophy-section plab-section ${className}`} style={style}>
      <div className="section-container philosophy-manifesto-container plab-inner" ref={innerRef}>
        <div className="manifesto-top-bar">
          <span className="manifesto-eyebrow">Design Philosophy</span>
        </div>
        {children}
      </div>
      {after}
    </section>
  )
}

function WordShell({ children, style }: { children: ReactNode; style?: MotionStyle }) {
  return (
    <span className="manifesto-scroll-word-wrapper">
      <motion.span className="manifesto-scroll-word" style={style}>
        {children}
      </motion.span>
    </span>
  )
}

/* ------------------------------------------------------------------ 0 */

function FadeWord({ word, i, p }: { word: string; i: number; p: MotionValue<number> }) {
  const r = range(i)
  const opacity = useTransform(p, r, [0.15, 1])
  const y = useTransform(p, r, [5, 0])
  return <WordShell style={{ opacity, y }}>{word}</WordShell>
}

export function Current() {
  const ref = useRef<HTMLDivElement>(null)
  const p = useReveal(ref)
  return (
    <Frame innerRef={ref}>
      <h2 className="manifesto-text left-aligned">
        {WORDS.map((w, i) => (
          <FadeWord key={i} word={w} i={i} p={p} />
        ))}
      </h2>
    </Frame>
  )
}

/* ------------------------------------------------------------------ 1 */

function BlurWord({ word, i, p }: { word: string; i: number; p: MotionValue<number> }) {
  const r = range(i, 1.8)
  const opacity = useTransform(p, r, [0.1, 1])
  const filter = useTransform(p, (v: number) => `blur(${(1 - clamp01((v - r[0]) / (r[1] - r[0]))) * 10}px)`)
  const y = useTransform(p, r, [8, 0])
  return <WordShell style={{ opacity, filter, y }}>{word}</WordShell>
}

export function BlurFocus() {
  const ref = useRef<HTMLDivElement>(null)
  const p = useReveal(ref)
  return (
    <Frame innerRef={ref}>
      <h2 className="manifesto-text left-aligned">
        {WORDS.map((w, i) => (
          <BlurWord key={i} word={w} i={i} p={p} />
        ))}
      </h2>
    </Frame>
  )
}

/* ------------------------------------------------------------------ 2 */

function SweepWord({ word, i, p }: { word: string; i: number; p: MotionValue<number> }) {
  /* A wide window so several words are mid-sweep at once: grey, then the
     ribbon's indigo/lavender, then settled ink. */
  const [a, b] = range(i, 3.2)
  const color = useTransform(p, [a, (a + b) / 2, b], ['#d5d8e0', '#7f82de', '#0b0e18'])
  return <WordShell style={{ color }}>{word}</WordShell>
}

export function HighlightSweep() {
  const ref = useRef<HTMLDivElement>(null)
  const p = useReveal(ref)
  return (
    <Frame innerRef={ref}>
      <h2 className="manifesto-text left-aligned">
        {WORDS.map((w, i) => (
          <SweepWord key={i} word={w} i={i} p={p} />
        ))}
      </h2>
    </Frame>
  )
}

/* ------------------------------------------------------------------ 3 */

type Geo = {
  lines: { top: number; height: number; left: number; right: number; words: number[] }[]
  words: { left: number; right: number; line: number }[]
}

/** Measures where each word sits, grouped into rendered lines. Re-runs on resize. */
function useWordGeometry(ref: RefObject<HTMLElement | null>) {
  const [geo, setGeo] = useState<Geo | null>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const spans = [...el.querySelectorAll<HTMLElement>('[data-w]')]
      const lines: Geo['lines'] = []
      const words: Geo['words'] = []
      spans.forEach((s, i) => {
        const top = s.offsetTop
        let line = lines.findIndex((l) => Math.abs(l.top - top) < 4)
        if (line < 0) {
          lines.push({ top, height: s.offsetHeight, left: s.offsetLeft, right: 0, words: [] })
          line = lines.length - 1
        }
        const L = lines[line]
        L.words.push(i)
        L.left = Math.min(L.left, s.offsetLeft)
        L.right = Math.max(L.right, s.offsetLeft + s.offsetWidth)
        words.push({ left: s.offsetLeft, right: s.offsetLeft + s.offsetWidth, line })
      })
      setGeo({ lines, words })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    document.fonts?.ready.then(measure)
    return () => ro.disconnect()
  }, [ref])
  return geo
}

function MaskLine({ words, i, count, p }: { words: string; i: number; count: number; p: MotionValue<number> }) {
  const start = (i / count) * 0.9
  const end = start + 1.4 / count
  const y = useTransform(p, [start, end], ['105%', '0%'])
  const opacity = useTransform(p, [start, end], [0, 1])
  return (
    <span className="plab-line">
      <motion.span className="plab-line__inner" style={{ y, opacity }}>
        {words}
      </motion.span>
    </span>
  )
}

export function LineByLine() {
  const ref = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLHeadingElement>(null)
  const p = useReveal(ref)
  const geo = useWordGeometry(measureRef)
  return (
    <Frame innerRef={ref}>
      <div className="plab-stack">
        {/* Invisible copy in normal flow: it sets the height and tells us where
            the browser breaks the lines at this width. */}
        <h2 className="manifesto-text left-aligned plab-measure" ref={measureRef} aria-hidden="true">
          {WORDS.map((w, i) => (
            <span key={i} className="manifesto-scroll-word-wrapper" data-w>
              {w}
            </span>
          ))}
        </h2>
        {geo && (
          <h2 className="manifesto-text left-aligned plab-overlay">
            {geo.lines.map((l, i) => (
              <MaskLine
                key={i}
                i={i}
                count={geo.lines.length}
                p={p}
                words={l.words.map((w) => WORDS[w]).join(' ')}
              />
            ))}
          </h2>
        )}
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ 4 */

type Effect = 'glow' | 'pulse' | 'shimmer' | 'spectrum' | 'underline'
const KEYWORDS: Record<string, Effect> = {
  feeling: 'glow',
  pulse: 'pulse',
  alive: 'shimmer',
  expressive: 'spectrum',
  felt: 'underline',
}

function KeywordWord({ word, i, p }: { word: string; i: number; p: MotionValue<number> }) {
  const r = range(i)
  const opacity = useTransform(p, r, [0.15, 1])
  const y = useTransform(p, r, [5, 0])
  const core = word.replace(/[^\w]/g, '')
  const tail = word.slice(core.length)
  const effect = KEYWORDS[core.toLowerCase()]
  const [on, setOn] = useState(false)
  useMotionValueEvent(p, 'change', (v) => {
    if (effect) setOn(v >= r[1])
  })
  if (!effect) return <WordShell style={{ opacity, y }}>{word}</WordShell>
  return (
    <WordShell style={{ opacity, y }}>
      <span className={`kw kw--${effect} ${on ? 'is-on' : ''}`}>{core}</span>
      {tail}
    </WordShell>
  )
}

export function Keywords() {
  const ref = useRef<HTMLDivElement>(null)
  const p = useReveal(ref)
  return (
    <Frame innerRef={ref}>
      <h2 className="manifesto-text left-aligned">
        {WORDS.map((w, i) => (
          <KeywordWord key={i} word={w} i={i} p={p} />
        ))}
      </h2>
    </Frame>
  )
}

/* ------------------------------------------------------------------ 5 */

const STATES = [
  { name: 'Calm', bg: '#e6f4fa', ink: '#2bbbc9' },
  { name: 'Active', bg: '#d9eef7', ink: '#1198a8' },
  { name: 'Attention', bg: '#fbf1de', ink: '#b47814' },
  { name: 'Success', bg: '#e4f3ee', ink: '#147864' },
]

export function EmotionColours() {
  const ref = useRef<HTMLDivElement>(null)
  const p = useReveal(ref)
  const stops = [0, 0.3, 0.55, 0.8, 1]
  const backgroundColor = useTransform(p, stops, ['#ffffff', ...STATES.map((s) => s.bg)])
  const [state, setState] = useState(0)
  useMotionValueEvent(p, 'change', (v) => {
    /* Nearest colour stop: Calm 0.3, Active 0.55, Attention 0.8, Success 1. */
    setState(v < 0.42 ? 0 : v < 0.67 ? 1 : v < 0.9 ? 2 : 3)
  })
  return (
    <motion.div style={{ backgroundColor }} className="plab-emotion">
      <Frame innerRef={ref}>
        <h2 className="manifesto-text left-aligned">
          {WORDS.map((w, i) => (
            <FadeWord key={i} word={w} i={i} p={p} />
          ))}
        </h2>
        <div className="plab-state-chip" style={{ color: STATES[state].ink }}>
          <span className="plab-state-dot" style={{ background: STATES[state].ink }} />
          {STATES[state].name}
        </div>
      </Frame>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ 6 */

function PinWord({ word, i, p }: { word: string; i: number; p: MotionValue<number> }) {
  const r = range(i, 1.2, 0.68)
  const opacity = useTransform(p, r, [0.12, 1])
  const y = useTransform(p, r, [10, 0])
  return <WordShell style={{ opacity, y }}>{word}</WordShell>
}

export function Pinned() {
  const outer = useRef<HTMLDivElement>(null)
  const { scrollYProgress: p } = useScroll({ target: outer, offset: ['start start', 'end end'] })
  const scale = useTransform(p, [0.76, 1], [1, 0.86])
  const y = useTransform(p, [0.76, 1], [0, -70])
  const fade = useTransform(p, [0.76, 1], [1, 0.3])
  const bar = useTransform(p, [0, 0.7], [0, 1])
  return (
    <div ref={outer} className="plab-pin">
      <div className="plab-pin__sticky">
        <motion.div style={{ scale, y, opacity: fade }} className="plab-pin__stage">
          <Frame>
            <h2 className="manifesto-text left-aligned">
              {WORDS.map((w, i) => (
                <PinWord key={i} word={w} i={i} p={p} />
              ))}
            </h2>
            <motion.div className="plab-pin__bar" style={{ scaleX: bar }} />
          </Frame>
        </motion.div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ 7 */

const GLYPHS = 'abcdefghijklmnopqrstuvwxyz#%&*+=/<>0123456789'
const rand = () => GLYPHS[(Math.random() * GLYPHS.length) | 0]
const scramble = (word: string, settled: number) =>
  word
    .split('')
    .map((c, k) => (k < settled || /[^\w]/.test(c) ? c : rand()))
    .join('')

function ScrambleWord({ word, i, p }: { word: string; i: number; p: MotionValue<number> }) {
  const r = range(i, 2)
  const [text, setText] = useState(() => scramble(word, 0))
  const opacity = useTransform(p, r, [0.25, 1])
  const update = (v: number) => {
    const t = clamp01((v - r[0]) / (r[1] - r[0]))
    setText(t >= 1 ? word : scramble(word, Math.floor(t * word.length)))
  }
  useMotionValueEvent(p, 'change', update)
  return (
    <span className="manifesto-scroll-word-wrapper">
      {/* The real word holds the width, so random letters never reflow the line. */}
      <motion.span className="manifesto-scroll-word plab-scramble" style={{ opacity }}>
        <span className="plab-scramble__ghost">{word}</span>
        <span className="plab-scramble__live">{text}</span>
      </motion.span>
    </span>
  )
}

export function Scramble() {
  const ref = useRef<HTMLDivElement>(null)
  const p = useReveal(ref)
  return (
    <Frame innerRef={ref}>
      <h2 className="manifesto-text left-aligned">
        {WORDS.map((w, i) => (
          <ScrambleWord key={i} word={w} i={i} p={p} />
        ))}
      </h2>
    </Frame>
  )
}

/* ------------------------------------------------------------------ 8 */

const LENS_R = 64
const LENS_ZOOM = 1.16

/** Converts lens progress (0–1 along the reading path) to a point in the text. */
function lensPoint(geo: Geo, t: number) {
  const widths = geo.lines.map((l) => l.right - l.left)
  const total = widths.reduce((a, b) => a + b, 0)
  let d = clamp01(t) * total
  for (let i = 0; i < geo.lines.length; i++) {
    if (d <= widths[i] || i === geo.lines.length - 1) {
      const l = geo.lines[i]
      return { x: l.left + Math.min(d, widths[i]), y: l.top + l.height / 2 }
    }
    d -= widths[i]
  }
  return { x: 0, y: 0 }
}

/** Where each word's centre falls along the reading path (0–1). */
function wordPositions(geo: Geo) {
  const widths = geo.lines.map((l) => l.right - l.left)
  const total = widths.reduce((a, b) => a + b, 0) || 1
  const before = widths.map((_, i) => widths.slice(0, i).reduce((a, b) => a + b, 0))
  return geo.words.map((w) => {
    const l = geo.lines[w.line]
    return (before[w.line] + ((w.left + w.right) / 2 - l.left)) / total
  })
}

function LensWord({ word, f, t }: { word: string; f: number; t: MotionValue<number> }) {
  const opacity = useTransform(t, [f - 0.03, f + 0.02], [0.14, 1])
  return (
    <span className="manifesto-scroll-word-wrapper" data-w>
      <motion.span className="manifesto-scroll-word" style={{ opacity }}>
        {word}
      </motion.span>
    </span>
  )
}

export function GlassLens() {
  const ref = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLHeadingElement>(null)
  const p = useReveal(ref)
  const geo = useWordGeometry(textRef)
  /* A little lead-in and run-out so the lens enters and leaves the text. */
  const t = useTransform(p, [0.02, 0.98], [-0.04, 1.04])
  const pos = geo ? wordPositions(geo) : WORDS.map((_, i) => i / N)
  const x = useTransform(t, (v) => (geo ? lensPoint(geo, v).x : 0))
  const y = useTransform(t, (v) => (geo ? lensPoint(geo, v).y : 0))
  const clipPath = useTransform([x, y], ([a, b]) => `circle(${LENS_R / LENS_ZOOM}px at ${a}px ${b}px)`)
  const origin = useTransform([x, y], ([a, b]) => `${a}px ${b}px`)
  const ringX = useTransform(x, (v) => v - LENS_R)
  const ringY = useTransform(y, (v) => v - LENS_R)
  const lensOpacity = useTransform(p, [0, 0.04, 0.96, 1], [0, 1, 1, 0])

  return (
    <Frame innerRef={ref}>
      <div className="plab-stack">
        <h2 className="manifesto-text left-aligned plab-lens-base" ref={textRef}>
          {WORDS.map((w, i) => (
            <LensWord key={i} word={w} f={pos[i]} t={t} />
          ))}
        </h2>
        {geo && (
          <>
            {/* A full-strength copy, magnified about the lens centre and
                clipped to the lens circle. */}
            <motion.h2
              className="manifesto-text left-aligned plab-overlay plab-lens-zoom"
              aria-hidden="true"
              style={{ clipPath, transformOrigin: origin, scale: LENS_ZOOM, opacity: lensOpacity }}
            >
              {WORDS.map((w, i) => (
                <span key={i} className="manifesto-scroll-word-wrapper">
                  <span className="manifesto-scroll-word">{w}</span>
                </span>
              ))}
            </motion.h2>
            <motion.div
              className="plab-lens-ring"
              style={{ x: ringX, y: ringY, width: LENS_R * 2, height: LENS_R * 2, opacity: lensOpacity }}
            />
          </>
        )}
      </div>
    </Frame>
  )
}

/* ------------------------------------------------------------------ 9 */

export function FluidBehind() {
  const ref = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const p = useReveal(ref)
  return (
    <section ref={sectionRef} className="plab-fluid">
      <AnimatedAtmosphere targetRef={sectionRef} reducedMotion={false} />
      <div className="plab-fluid__content">
        <Frame innerRef={ref}>
          <h2 className="manifesto-text left-aligned">
            {WORDS.map((w, i) => (
              <FadeWord key={i} word={w} i={i} p={p} />
            ))}
          </h2>
        </Frame>
      </div>
    </section>
  )
}

/* ----------------------------------------------------------------- 10 */

/* Deterministic scatter so every visit lands the same way. */
const seeded = (i: number, k: number) => {
  const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453
  return (s - Math.floor(s)) * 2 - 1
}

function FlyWord({ word, i, p }: { word: string; i: number; p: MotionValue<number> }) {
  const r = range(i, 3)
  const x = useTransform(p, r, [seeded(i, 1) * 140, 0])
  const y = useTransform(p, r, [seeded(i, 2) * 90 + 40, 0])
  const rotate = useTransform(p, r, [seeded(i, 3) * 28, 0])
  const scale = useTransform(p, r, [1 + seeded(i, 4) * 0.35, 1])
  const opacity = useTransform(p, r, [0, 1])
  const filter = useTransform(p, (v: number) => `blur(${(1 - clamp01((v - r[0]) / (r[1] - r[0]))) * 6}px)`)
  return <WordShell style={{ x, y, rotate, scale, opacity, filter }}>{word}</WordShell>
}

export function FlyIn() {
  const ref = useRef<HTMLDivElement>(null)
  const p = useReveal(ref)
  return (
    <Frame innerRef={ref}>
      <h2 className="manifesto-text left-aligned plab-perspective">
        {WORDS.map((w, i) => (
          <FlyWord key={i} word={w} i={i} p={p} />
        ))}
      </h2>
    </Frame>
  )
}

/* ------------------------------------------------------------------ */

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

export type Variant = {
  id: string
  name: string
  group: string
  note: string
  Component: () => ReactNode
}

export const VARIANTS: Variant[] = [
  { id: 'current', name: 'Current', group: 'Live', note: 'What ships today: words brighten and rise in reading order.', Component: Current },
  { id: 'blur', name: 'Blur to focus', group: 'Subtle', note: 'Each word pulls into focus from a soft blur.', Component: BlurFocus },
  { id: 'sweep', name: 'Highlight sweep', group: 'Subtle', note: 'A band of the ribbon’s indigo/lavender runs through grey text, leaving ink behind.', Component: HighlightSweep },
  { id: 'lines', name: 'Line by line', group: 'Subtle', note: 'Whole lines rise from behind a mask, like a title card.', Component: LineByLine },
  { id: 'keywords', name: 'Living keywords', group: 'On-brand', note: 'Keywords act out their meaning: feeling glows, pulse beats, alive shimmers, expressive cycles the state colours, felt underlines.', Component: Keywords },
  { id: 'emotion', name: 'Emotion colours', group: 'On-brand', note: 'The section moves through the OrbitSense states (Calm → Active → Attention → Success) as it reveals.', Component: EmotionColours },
  { id: 'pinned', name: 'Pinned reading', group: 'On-brand', note: 'The section holds still while the words fill in, then recedes as you continue.', Component: Pinned },
  { id: 'scramble', name: 'Scramble decode', group: 'Bold', note: 'Words resolve out of random glyphs, like a system thinking.', Component: Scramble },
  { id: 'lens', name: 'Glass lens', group: 'Bold', note: 'A glass lens travels the text in reading order, magnifying and lighting what it passes.', Component: GlassLens },
  { id: 'fluid', name: 'Fluid backdrop', group: 'Bold', note: 'The hero’s fluid gradient sits behind the manifesto. Hover to stir it.', Component: FluidBehind },
  { id: 'fly', name: 'Fly into place', group: 'Bold', note: 'Words drift in from a scattered, tilted state and settle into the sentence.', Component: FlyIn },
]
