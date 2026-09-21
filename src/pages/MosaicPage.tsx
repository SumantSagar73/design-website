import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Inbox,
  MoreHorizontal,
  Phone,
  Search,
  TrendingUp,
} from 'lucide-react'

// Live MyOperator design-system components, consumed from source.
import { Button } from '@sb/components/ui/button'
import { Badge } from '@sb/components/ui/badge'
import { Tag } from '@sb/components/ui/tag'
import { Avatar } from '@sb/components/ui/avatar'
import { Switch } from '@sb/components/ui/switch'
import { Checkbox } from '@sb/components/ui/checkbox'
import { Skeleton } from '@sb/components/ui/skeleton'
import { Spinner } from '@sb/components/ui/spinner'
import { BouncingLoader } from '@sb/components/ui/bouncing-loader'
import { Alert, AlertTitle, AlertDescription } from '@sb/components/ui/alert'
import { EmptyState } from '@sb/components/ui/empty-state'
import { ContactListItem } from '@sb/components/ui/contact-list-item'
import { SystemMessage } from '@sb/components/ui/system-message'
import { DateDivider } from '@sb/components/ui/date-divider'
import { Input } from '@sb/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@sb/components/ui/tabs'
import { NumberStepField } from '@sb/components/ui/number-step-field'
import { AudioMedia } from '@sb/components/custom/audio-media'

import '../showcase/storybook-ui.css'
import './MosaicPage.css'

/* ------------------------------------------------------------------ *
 * 1. The partition
 *
 * The board is one rectangle split recursively in two, exactly like the
 * reference blueprint. The tree's shape is built once and frozen, so the
 * cell count never changes; what changes each cycle is every split's
 * ratio. Cells grow, shrink and flip between wide and tall while the
 * board still tiles perfectly.
 * ------------------------------------------------------------------ */

type Split = { kind: 'split'; dir: 'h' | 'v'; index: number; a: Node; b: Node }
type Leaf = { kind: 'leaf'; id: number }
type Node = Split | Leaf
type Rect = { x: number; y: number; w: number; h: number }

/** Deterministic PRNG so the layout is identical on every reload. */
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const MIN_W = 0.055
const MIN_H = 0.09
const MAX_DEPTH = 6
/** Headroom a node needs before it may split again. */
const SPLIT_GUARD = 2.4
/**
 * How strongly a node prefers to cut across its longer side. Left at 0.82 it
 * keeps cells from drifting toward uniform squares; pushing it further toward
 * horizontal cuts was tried and is worse — those exhaust the available height
 * quickly and collapse the tree to a handful of bands.
 */
const LONG_BIAS = 0.82

function buildTree(rand: () => number) {
  let leafCount = 0
  let splitCount = 0

  const build = (w: number, h: number, depth: number): Node => {
    const tooSmall = w < MIN_W * SPLIT_GUARD && h < MIN_H * SPLIT_GUARD
    const stop = tooSmall || depth >= MAX_DEPTH || (depth >= 2 && rand() < 0.14)
    if (stop) return { kind: 'leaf', id: leafCount++ }

    const canV = w >= MIN_W * SPLIT_GUARD
    const canH = h >= MIN_H * SPLIT_GUARD
    let dir: 'h' | 'v'
    if (canV && canH) {
      // Which way is this cell "longer", measured in minimum-size units?
      const longerIsWidth = w / MIN_W > h / MIN_H
      dir = rand() < (longerIsWidth ? 1 - LONG_BIAS : LONG_BIAS) ? 'h' : 'v'
    } else dir = canV ? 'v' : 'h'

    const index = splitCount++
    // Pessimistic child extent, not the nominal half, so the guard holds
    // even after an unlucky run of lopsided rolls.
    const cw = dir === 'v' ? w * 0.46 : w
    const ch = dir === 'h' ? h * 0.46 : h
    return { kind: 'split', dir, index, a: build(cw, ch, depth + 1), b: build(cw, ch, depth + 1) }
  }

  return { root: build(1, 1, 0), leafCount, splitCount }
}

/**
 * Turn a raw 0-1 roll into a safe split ratio. The skew has to shrink as the
 * parent approaches the minimum size, or a lopsided roll collapses a child to
 * nothing. Allowing `min/extent` at each end keeps every child at the floor.
 */
function splitRatio(raw: number, extent: number, min: number) {
  const floor = min / extent
  return 0.5 + (raw - 0.5) * Math.max(0, Math.min(0.62, 2 * (0.5 - floor)))
}

function layout(node: Node, rect: Rect, rolls: number[], out: Rect[]) {
  if (node.kind === 'leaf') {
    out[node.id] = rect
    return
  }
  const raw = rolls[node.index]
  if (node.dir === 'v') {
    const wa = rect.w * splitRatio(raw, rect.w, MIN_W)
    layout(node.a, { ...rect, w: wa }, rolls, out)
    layout(node.b, { ...rect, x: rect.x + wa, w: rect.w - wa }, rolls, out)
  } else {
    const ha = rect.h * splitRatio(raw, rect.h, MIN_H)
    layout(node.a, { ...rect, h: ha }, rolls, out)
    layout(node.b, { ...rect, y: rect.y + ha, h: rect.h - ha }, rolls, out)
  }
}

/* ------------------------------------------------------------------ *
 * 2. Fitting a component to a rectangle
 *
 * Every component states the smallest box it can honestly live in, plus
 * the shape it wants to be. A cell then only ever considers components
 * that actually fit its current pixel size, and prefers the ones whose
 * proportion and footprint match what it has become.
 * ------------------------------------------------------------------ */

type Live = {
  step: number
  notify: boolean
  setNotify: (v: boolean) => void
  agree: boolean | 'indeterminate'
  setAgree: (v: boolean | 'indeterminate') => void
  hours: number
  setHours: (v: number) => void
}

type Spec = {
  id: string
  tag: string
  /** Smallest box this component reads well in, in CSS pixels. */
  minW: number
  minH: number
  /** The width:height it naturally wants. */
  aspect: number
  render: (live: Live) => ReactNode
}

const SPARK = [0.42, 0.68, 0.5, 0.82, 0.6, 0.95, 0.74, 1, 0.66, 0.88]

function Sparkline() {
  return (
    <div className="mini-spark" aria-hidden="true">
      {SPARK.map((v, i) => (
        <span key={i} style={{ height: `${v * 100}%`, animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  )
}

function StatCard({
  label,
  value,
  delta,
  spark,
}: {
  label: string
  value: string
  delta?: string
  spark?: boolean
}) {
  return (
    <div className="mini-stat">
      <span className="mini-label">{label}</span>
      <span className="mini-value">{value}</span>
      {delta && (
        <span className="mini-delta">
          <TrendingUp size={12} />
          {delta}
        </span>
      )}
      {spark && <Sparkline />}
    </div>
  )
}

const STEPS = ['Reading the transcript', 'Matching intent', 'Drafting the reply']

function ThinkingState({ active }: { active: number }) {
  return (
    <div className="mini-steps">
      <span className="mini-label">
        <Bot size={13} /> Ray is working
      </span>
      {STEPS.map((s, i) => (
        <div key={s} className="mini-step" data-state={i < active ? 'done' : i === active ? 'active' : 'idle'}>
          <span className="mini-dot" />
          <span className="mini-step-text">{s}</span>
        </div>
      ))}
    </div>
  )
}

/**
 * The catalogue. Minimums are deliberately honest — an audio player needs
 * real width, a badge needs almost none — because they are what stops a
 * component landing somewhere it cannot be read.
 */
const SPECS: Spec[] = [
  // --- tokens -----------------------------------------------------------
  { id: 'badge-active', tag: 'Badge', minW: 96, minH: 42, aspect: 2.4, render: () => <Badge variant="active" size="sm">Active</Badge> },
  { id: 'badge-channel', tag: 'Badge', minW: 118, minH: 42, aspect: 2.8, render: () => <Badge variant="information" size="sm">WhatsApp</Badge> },
  { id: 'tag-followup', tag: 'Tag', minW: 104, minH: 42, aspect: 2.5, render: () => <Tag variant="info" size="sm">Follow-up</Tag> },
  { id: 'tag-resolved', tag: 'Tag', minW: 100, minH: 42, aspect: 2.5, render: () => <Tag variant="success" size="sm">Resolved</Tag> },
  { id: 'avatar', tag: 'Avatar', minW: 62, minH: 62, aspect: 1, render: () => <Avatar name="Aarti Sharma" size="md" status="online" /> },
  { id: 'spinner', tag: 'Spinner', minW: 58, minH: 58, aspect: 1, render: () => <Spinner /> },
  { id: 'typing', tag: 'Typing', minW: 72, minH: 50, aspect: 1.6, render: () => <BouncingLoader /> },
  { id: 'switch', tag: 'Switch', minW: 70, minH: 46, aspect: 1.8, render: (l) => <Switch checked={l.notify} onCheckedChange={l.setNotify} /> },
  { id: 'icon-phone', tag: 'Icon', minW: 56, minH: 56, aspect: 1, render: () => <Button size="icon-sm" variant="ghost"><Phone size={16} /></Button> },
  { id: 'icon-search', tag: 'Icon', minW: 56, minH: 56, aspect: 1, render: () => <Button size="icon-sm" variant="ghost"><Search size={16} /></Button> },
  { id: 'icon-more', tag: 'Icon', minW: 56, minH: 56, aspect: 1, render: () => <Button size="icon-sm" variant="ghost"><MoreHorizontal size={16} /></Button> },
  { id: 'checkbox', tag: 'Checkbox', minW: 56, minH: 46, aspect: 1.2, render: (l) => <Checkbox checked={l.agree} onCheckedChange={l.setAgree} /> },
  // The smallest real components, for cells close to the partition minimum.
  { id: 'avatar-xs', tag: 'Avatar', minW: 44, minH: 44, aspect: 1, render: () => <Avatar name="Ravi Menon" size="xs" /> },
  { id: 'skeleton-bar', tag: 'Skeleton', minW: 46, minH: 30, aspect: 3, render: () => <Skeleton height={8} /> },

  // --- controls ---------------------------------------------------------
  { id: 'button', tag: 'Button', minW: 150, minH: 60, aspect: 2.6, render: () => <Button size="sm">New broadcast</Button> },
  { id: 'button-pair', tag: 'Buttons', minW: 262, minH: 62, aspect: 4, render: () => (
    <div className="mini-row"><Button size="sm">Broadcast</Button><Button size="sm" variant="outline">Export</Button></div>
  ) },
  { id: 'checkbox-label', tag: 'Checkbox', minW: 208, minH: 52, aspect: 4.2, render: (l) => (
    <Checkbox checked={l.agree} onCheckedChange={l.setAgree} label="Notify on handover" />
  ) },
  { id: 'switch-label', tag: 'Switch', minW: 196, minH: 52, aspect: 4, render: (l) => (
    <Switch checked={l.notify} onCheckedChange={l.setNotify} label="Notifications" />
  ) },
  { id: 'input', tag: 'Search', minW: 226, minH: 66, aspect: 4.4, render: () => <Input placeholder="Search conversations" /> },
  { id: 'tabs', tag: 'Tabs', minW: 252, minH: 64, aspect: 4.2, render: () => (
    <Tabs defaultValue="all">
      <TabsList>
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="mine">Mine</TabsTrigger>
        <TabsTrigger value="done">Done</TabsTrigger>
      </TabsList>
    </Tabs>
  ) },
  { id: 'stepper', tag: 'Stepper', minW: 206, minH: 70, aspect: 3.2, render: (l) => (
    <NumberStepField value={l.hours} onValueChange={l.setHours} suffix="hours" min={1} max={24} />
  ) },

  // --- rows -------------------------------------------------------------
  { id: 'divider', tag: 'Divider', minW: 182, minH: 50, aspect: 4.5, render: () => <DateDivider>Today</DateDivider> },
  { id: 'system', tag: 'System', minW: 244, minH: 56, aspect: 4.6, render: () => <SystemMessage>**Ravi** was assigned to you</SystemMessage> },
  { id: 'contact', tag: 'Contact', minW: 288, minH: 76, aspect: 4.2, render: () => (
    <ContactListItem name="Ravi Menon" subtitle="+91 98200 41122" trailing={<Badge variant="information" size="sm">WhatsApp</Badge>} />
  ) },
  { id: 'contact-sla', tag: 'Contact', minW: 276, minH: 76, aspect: 4.2, render: () => (
    <ContactListItem name="Priya Nair" subtitle="Escalated · 2m ago" trailing={<Tag variant="error" size="sm">SLA</Tag>} />
  ) },
  { id: 'audio', tag: 'Call recording', minW: 372, minH: 86, aspect: 4.6, render: () => <AudioMedia duration="4:12" playedBars={22} /> },

  // --- blocks -----------------------------------------------------------
  { id: 'stat', tag: 'Insights', minW: 186, minH: 96, aspect: 1.9, render: () => (
    <StatCard label="Avg. handle time" value="3m 08s" delta="21s faster" />
  ) },
  { id: 'stat-spark', tag: 'Insights', minW: 228, minH: 156, aspect: 1.5, render: () => (
    <StatCard label="Collected this month" value="₹32,480" delta="12% vs last month" spark />
  ) },
  { id: 'stat-calls', tag: 'Insights', minW: 214, minH: 152, aspect: 1.5, render: () => (
    <StatCard label="Answered calls" value="1,284" delta="8% this week" spark />
  ) },
  { id: 'alert', tag: 'Alert', minW: 292, minH: 108, aspect: 2.7, render: () => (
    <Alert variant="success">
      <CheckCircle2 size={16} />
      <AlertTitle>Payment received</AlertTitle>
      <AlertDescription>₹4,200 settled to your wallet.</AlertDescription>
    </Alert>
  ) },
  { id: 'thinking', tag: 'AI state', minW: 262, minH: 168, aspect: 1.7, render: (l) => <ThinkingState active={l.step} /> },
  { id: 'empty', tag: 'Empty state', minW: 268, minH: 190, aspect: 1.5, render: () => (
    <EmptyState icon={<Inbox size={20} />} title="Inbox zero" description="Every conversation has been handled." />
  ) },
  { id: 'skeleton', tag: 'Skeleton', minW: 196, minH: 132, aspect: 1.6, render: () => (
    <div className="mini-stack">
      <Skeleton shape="circle" width={32} height={32} />
      <Skeleton />
      <Skeleton width="78%" />
      <Skeleton width="54%" />
    </div>
  ) },
  { id: 'palette', tag: 'Palette', minW: 152, minH: 96, aspect: 1.8, render: () => (
    <div className="mini-swatches" aria-hidden="true">
      {['#6b7ce0', '#a8c6ff', '#c4ccfa', '#ffc4e2', '#ffceba', '#27abb8', '#343e55', '#e9eaeb'].map((c) => (
        <span key={c} style={{ background: c }} />
      ))}
    </div>
  ) },

  // --- columns ----------------------------------------------------------
  { id: 'timeline', tag: 'Timeline', minW: 236, minH: 172, aspect: 1.2, render: () => (
    <div className="mini-stack">
      <DateDivider>Today</DateDivider>
      <SystemMessage>Call ended · **4m 12s**</SystemMessage>
      <SystemMessage>**Ravi** joined</SystemMessage>
    </div>
  ) },
  { id: 'team', tag: 'Team', minW: 86, minH: 176, aspect: 0.45, render: () => (
    <div className="mini-stack mini-center">
      <Avatar name="Aarti Sharma" size="sm" status="online" />
      <Avatar name="Ravi Menon" size="sm" />
      <Avatar name="Priya Nair" size="sm" status="busy" />
    </div>
  ) },
  { id: 'tag-column', tag: 'Tags', minW: 134, minH: 166, aspect: 0.7, render: () => (
    <div className="mini-stack mini-center">
      <Tag variant="success" size="sm">Resolved</Tag>
      <Tag variant="info" size="sm">Follow-up</Tag>
      <Tag variant="warning" size="sm">Queued</Tag>
    </div>
  ) },
  { id: 'skeleton-column', tag: 'Skeleton', minW: 112, minH: 150, aspect: 0.6, render: () => (
    <div className="mini-stack">
      <Skeleton />
      <Skeleton width="72%" />
      <Skeleton />
      <Skeleton width="45%" />
    </div>
  ) },
]

/** Always fits, for the rare cell too small for anything in the catalogue. */
const FALLBACK: Spec = {
  id: 'token',
  tag: '',
  minW: 0,
  minH: 0,
  aspect: 1,
  render: () => <span className="mini-token" aria-hidden="true" />,
}

/**
 * Score how well a spec suits a rectangle. Proportion matters most — a wide
 * component in a tall box looks wrong even when it technically fits — with
 * footprint as the tiebreak so a badge does not claim a hero-sized cell.
 */
function fitScore(cellW: number, cellH: number, spec: Spec) {
  const proportion =
    1 - Math.min(1, Math.abs(Math.log(cellW / cellH / spec.aspect)) / Math.log(5))
  const areaRatio = (cellW * cellH) / (spec.minW * spec.minH)
  // Ideal is a cell roughly 1-3x the component's minimum: room to breathe,
  // without the component rattling around in a much bigger box.
  const footprint = 1 - Math.min(1, Math.abs(Math.log(areaRatio / 1.8)) / Math.log(14))
  return proportion * 0.62 + footprint * 0.38
}

/** How much a repeat within the same cycle costs a candidate. */
const REPEAT_PENALTY = 0.16

/**
 * Assign a component to every cell for one cycle.
 *
 * Done in one pass rather than per cell, for two reasons: the largest cells
 * choose first, so the hero components get the homes that suit them; and a
 * component already placed this cycle is penalised, so the board does not
 * show the same palette swatch four times.
 */
function assignSpecs(cells: { w: number; h: number }[], cycle: number): Spec[] {
  const used = new Map<string, number>()
  const result: Spec[] = new Array(cells.length)
  const order = cells
    .map((c, id) => ({ id, area: c.w * c.h }))
    .sort((a, b) => b.area - a.area)

  for (const { id } of order) {
    const { w, h } = cells[id]
    const fits = SPECS.filter((s) => w >= s.minW && h >= s.minH)
    if (!fits.length) {
      result[id] = FALLBACK
      continue
    }
    const ranked = fits
      .map((s) => ({ s, score: fitScore(w, h, s) - (used.get(s.id) ?? 0) * REPEAT_PENALTY }))
      .sort((a, b) => b.score - a.score)
    // Choose among the genuinely good matches, so the board varies between
    // cycles without ever putting a component somewhere it does not belong.
    const shortlist = ranked.filter((r) => r.score >= ranked[0].score - 0.08).slice(0, 5)
    const pick = shortlist[(id * 7 + cycle * 3) % shortlist.length].s
    used.set(pick.id, (used.get(pick.id) ?? 0) + 1)
    result[id] = pick
  }
  return result
}

/* ------------------------------------------------------------------ */

const CYCLE_MS = 6000
/** Space between cards; the fit is judged on the card, not the slot. */
const GAP = 12

export default function MosaicPage({ onBack }: { onBack?: () => void }) {
  const reduced = !!useReducedMotion()
  const [step, setStep] = useState(1)
  const [notify, setNotify] = useState(true)
  const [agree, setAgree] = useState<boolean | 'indeterminate'>(true)
  const [hours, setHours] = useState(2)
  const [cycle, setCycle] = useState(0)
  const [board, setBoard] = useState({ w: 0, h: 0 })
  const boardRef = useRef<HTMLDivElement>(null)

  // Real pixel size of the board. Component minimums are in pixels, so the
  // fit has to be judged against real measurements, not fractions.
  useEffect(() => {
    const el = boardRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setBoard({ w: width, h: height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const tree = useMemo(() => buildTree(mulberry32(20260921)), [])

  const rects = useMemo(() => {
    const rand = mulberry32(9137 + cycle * 7919)
    const rolls = Array.from({ length: tree.splitCount }, rand)
    const out: Rect[] = []
    layout(tree.root, { x: 0, y: 0, w: 1, h: 1 }, rolls, out)
    return out
  }, [tree, cycle])

  useEffect(() => {
    if (reduced) return
    const id = window.setInterval(() => setCycle((c) => c + 1), CYCLE_MS)
    return () => window.clearInterval(id)
  }, [reduced])

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % (STEPS.length + 1)), 2400)
    return () => clearInterval(id)
  }, [])

  // Cards are inset by the gap, so the fit is judged on the visible card
  // rather than the slot it sits in.
  const specs = useMemo(() => {
    if (!board.w) return []
    return assignSpecs(
      rects.map((r) => ({ w: r.w * board.w - GAP, h: r.h * board.h - GAP })),
      cycle,
    )
  }, [rects, board, cycle])

  const live: Live = { step, notify, setNotify, agree, setAgree, hours, setHours }

  return (
    <div className="mosaic-page">
      <div className="mosaic-atmosphere" />

      <header className="mosaic-head">
        {onBack && (
          <button type="button" className="mosaic-back" onClick={onBack}>
            <ArrowLeft size={14} /> Back
          </button>
        )}
        <h1 className="mosaic-title">
          Every detail, <em>deliberate.</em>
        </h1>
        <p className="mosaic-sub">
          The grid keeps repartitioning itself, and every rectangle takes the component that suits
          the shape it has become — each one rendered live from the design system.
        </p>
      </header>

      <div className="mosaic-board" ref={boardRef}>
        {board.w > 0 &&
          rects.map((rect, id) => {
            const w = rect.w * board.w - GAP
            const h = rect.h * board.h - GAP
            const spec = specs[id]
            const showTag = spec.tag !== '' && h >= 104 && w >= 132

            return (
              <motion.div
                key={id}
                className="mosaic-slot"
                initial={false}
                animate={{
                  x: rect.x * board.w,
                  y: rect.y * board.h,
                  width: rect.w * board.w,
                  height: rect.h * board.h,
                }}
                transition={
                  reduced
                    ? { duration: 0 }
                    : // No per-cell stagger: every rectangle must move in
                      // lockstep or the tiling visibly tears open mid-morph.
                      { duration: 1.15, ease: [0.32, 0.72, 0, 1] }
                }
              >
                <div className="mosaic-cell">
                  {showTag && <span className="mosaic-tag">{spec.tag}</span>}
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={spec.id}
                      className="mosaic-content"
                      initial={reduced ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={reduced ? undefined : { opacity: 0 }}
                      transition={{ duration: 0.28, ease: 'easeOut' }}
                    >
                      {spec.render(live)}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            )
          })}
      </div>

      <footer className="mosaic-foot">
        <a href="https://storybook-npm-psi.vercel.app/" target="_blank" rel="noreferrer">
          Open the Storybook <ArrowUpRight size={12} />
        </a>
      </footer>
    </div>
  )
}
