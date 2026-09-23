import { useEffect, useRef } from 'react'

import orbitalUrl from '../assets/orbital.png'
import { GLYPH, GLYPH_BOX } from '../components/glyphShape'

/* ------------------------------------------------------------------ palette */
/* Lifted from the site: ink and greys from :root, the ribbon's indigo →
   lavender, the hero atmosphere's peach / pink / blue, and the four
   OrbitSense states. */
export const C = {
  ink: '#0b0e18',
  ink2: '#5f6470',
  ink3: '#8a8f9c',
  line: 'rgba(10, 11, 16, 0.08)',
  indigo: '#3c4a9e',
  violet: '#7f82de',
  lav: '#a39ded',
  peach: '#ffceba',
  pink: '#ffc4e2',
  blue: '#a8c6ff',
  sky: '#8fd0f5',
  glyph: '#2a52dc',
}

export type StateKey = 'Calm' | 'Active' | 'Alert' | 'Resolve'
export const STATES: Record<StateKey, { color: string; soft: string; tempo: number; chord: number[] }> = {
  Calm: { color: '#2bbbc9', soft: '#c8e6f3', tempo: 0.9, chord: [432, 648, 864] },
  Active: { color: '#1198a8', soft: '#a6daee', tempo: 1.5, chord: [587.33, 880, 1174.66] },
  Alert: { color: '#b47814', soft: '#f7e1b8', tempo: 2.2, chord: [466.16, 698.46, 932.33] },
  Resolve: { color: '#147864', soft: '#cdebe2', tempo: 1.1, chord: [528, 660, 792, 1056] },
}
export const STATE_KEYS = Object.keys(STATES) as StateKey[]

/* ------------------------------------------------------------------ canvas */

export type Frame = { ctx: CanvasRenderingContext2D; w: number; h: number; dt: number; t: number }

/**
 * Runs `draw` every animation frame on a DPR-sharp canvas that fills its
 * parent. `draw` is read through a ref, so it can close over fresh state
 * without restarting the loop.
 */
export function useCanvasLoop(draw: (f: Frame) => void) {
  const ref = useRef<HTMLCanvasElement>(null)
  const drawRef = useRef(draw)
  drawRef.current = draw

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let w = 1
    let h = 1
    const resize = () => {
      const r = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = Math.max(1, r.width)
      h = Math.max(1, r.height)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    let raf = 0
    let last = performance.now()
    let t = 0
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      const dt = Math.min((now - last) / 1000, 1 / 20)
      last = now
      t += dt
      ctx.clearRect(0, 0, w, h)
      drawRef.current({ ctx, w, h, dt, t })
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return ref
}

/** Pointer position relative to an element. */
export const local = (e: { clientX: number; clientY: number }, el: Element) => {
  const r = el.getBoundingClientRect()
  return { x: e.clientX - r.left, y: e.clientY - r.top }
}

/* ------------------------------------------------------------------ drawing */

/** The glass orbit ring: a tilted ellipse with a lavender → blue → peach rim. */
export function drawGlassRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  opts: { tilt?: number; squash?: number; width?: number; alpha?: number } = {},
) {
  const { tilt = -0.32, squash = 0.62, width = Math.max(2, r * 0.16), alpha = 1 } = opts
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(x, y)
  ctx.rotate(tilt)
  ctx.scale(1, squash)
  const g = ctx.createLinearGradient(-r, -r, r, r)
  g.addColorStop(0, 'rgba(163,157,237,0.95)')
  g.addColorStop(0.45, 'rgba(143,208,245,0.95)')
  g.addColorStop(0.75, 'rgba(255,196,226,0.9)')
  g.addColorStop(1, 'rgba(255,206,186,0.95)')
  ctx.strokeStyle = g
  ctx.lineWidth = width / squash
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.stroke()
  /* specular highlight along the top rim */
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'
  ctx.lineWidth = (width / squash) * 0.28
  ctx.beginPath()
  ctx.arc(0, 0, r, Math.PI * 1.1, Math.PI * 1.55)
  ctx.stroke()
  ctx.restore()
}

/** The ribbon gradient, for fills and strokes along a span. */
export function ribbonGradient(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1)
  g.addColorStop(0, C.indigo)
  g.addColorStop(0.45, C.violet)
  g.addColorStop(1, C.lav)
  return g
}

const glyphPath = typeof Path2D !== 'undefined' ? new Path2D(GLYPH) : null

/** The MyOrbit mark, fitted into a box of height `h` centred at (x, y). */
export function drawGlyph(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  h: number,
  opts: { rotate?: number; alpha?: number; fill?: string | CanvasGradient; stripes?: boolean } = {},
) {
  if (!glyphPath) return
  const { rotate = 0, alpha = 1, fill, stripes = true } = opts
  const s = h / GLYPH_BOX.h
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(x, y)
  ctx.rotate(rotate)
  ctx.scale(s, s)
  ctx.translate(-(GLYPH_BOX.x + GLYPH_BOX.w / 2), -(GLYPH_BOX.y + GLYPH_BOX.h / 2))
  const g = ctx.createLinearGradient(GLYPH_BOX.x, GLYPH_BOX.y + GLYPH_BOX.h, GLYPH_BOX.x + GLYPH_BOX.w, GLYPH_BOX.y)
  g.addColorStop(0, '#4b72f0')
  g.addColorStop(0.55, C.glyph)
  g.addColorStop(1, '#5b83f5')
  ctx.shadowColor = 'rgba(42,82,220,0.35)'
  ctx.shadowBlur = 24 / s
  ctx.fillStyle = fill ?? g
  ctx.fill(glyphPath)
  ctx.shadowBlur = 0
  if (stripes) {
    /* A soft highlight riding the ring's upper arc, so it reads as a solid
       band rather than a flat outline. */
    ctx.save()
    ctx.clip(glyphPath)
    const sheen = ctx.createLinearGradient(
      GLYPH_BOX.x,
      GLYPH_BOX.y,
      GLYPH_BOX.x + GLYPH_BOX.w,
      GLYPH_BOX.y + GLYPH_BOX.h,
    )
    sheen.addColorStop(0, 'rgba(255,255,255,0.55)')
    sheen.addColorStop(0.45, 'rgba(255,255,255,0)')
    sheen.addColorStop(1, 'rgba(214,228,255,0.45)')
    ctx.fillStyle = sheen
    ctx.fill(glyphPath)
    ctx.restore()
  }
  ctx.restore()
}

/* The MyOrbit orbital, as artwork. The source PNG ships on a flat light
   background; this lifts it out so the sprite composites on any surface. */
let orbitalSprite: HTMLCanvasElement | null = null

/** Clears the flat backdrop by flooding inward from the edges, so the pale
    highlights *inside* the orbital are kept rather than punched through. */
function liftBackdrop(img: HTMLImageElement) {
  const c = document.createElement('canvas')
  const W = (c.width = img.naturalWidth)
  const H = (c.height = img.naturalHeight)
  const x = c.getContext('2d', { willReadFrequently: true })
  if (!x) return null
  x.drawImage(img, 0, 0)
  const data = x.getImageData(0, 0, W, H)
  const p = data.data
  const r0 = p[0]
  const g0 = p[1]
  const b0 = p[2]
  const TOL = 30
  const seen = new Uint8Array(W * H)
  const fill = (seeds: number[]) => {
    const stack = seeds.slice()
    while (stack.length) {
      const yy = stack.pop()!
      const xx = stack.pop()!
      if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue
      const k = yy * W + xx
      if (seen[k]) continue
      const i = k * 4
      if (
        Math.abs(p[i] - r0) > TOL ||
        Math.abs(p[i + 1] - g0) > TOL ||
        Math.abs(p[i + 2] - b0) > TOL
      )
        continue
      seen[k] = 1
      p[i + 3] = 0
      stack.push(xx + 1, yy, xx - 1, yy, xx, yy + 1, xx, yy - 1)
    }
  }

  const border: number[] = []
  for (let i = 0; i < W; i++) border.push(i, 0, i, H - 1)
  for (let j = 0; j < H; j++) border.push(0, j, W - 1, j)
  fill(border)
  /* The orbital encloses a hole the border pass can never reach, so seed it
     from the centre as well. */
  fill([W >> 1, H >> 1])
  x.putImageData(data, 0, 0)
  return c
}

if (typeof Image !== 'undefined') {
  const img = new Image()
  img.src = orbitalUrl
  const build = () => {
    orbitalSprite = liftBackdrop(img)
  }
  if (img.complete && img.naturalWidth) build()
  else img.onload = build
}

/** The orbital artwork, fitted to a box of height `h` centred at (x, y). */
export function drawOrbital(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  h: number,
  opts: { rotate?: number; alpha?: number } = {},
) {
  const sprite = orbitalSprite
  if (!sprite) return
  const { rotate = 0, alpha = 1 } = opts
  const w = h * (sprite.width / sprite.height)
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(x, y)
  ctx.rotate(rotate)
  ctx.drawImage(sprite, -w / 2, -h / 2, w, h)
  ctx.restore()
}

/** Ray's mark: four diamonds in a pinwheel, teal-green. */
export function drawRayMark(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotate = 0, alpha = 1) {
  const s = size / 24
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(x, y)
  ctx.rotate(rotate)
  ctx.scale(s, s)
  ctx.translate(-12, -12)
  const g = ctx.createLinearGradient(0, 0, 24, 24)
  g.addColorStop(0, '#1fd79a')
  g.addColorStop(1, '#3be3cf')
  ctx.fillStyle = g
  const petals = [
    [12, 0.5, 17, 6.2, 12, 12, 7, 6.2],
    [23.5, 12, 17.8, 17, 12, 12, 17.8, 7],
    [12, 23.5, 7, 17.8, 12, 12, 17, 17.8],
    [0.5, 12, 6.2, 7, 12, 12, 6.2, 17],
  ]
  for (const p of petals) {
    ctx.beginPath()
    ctx.moveTo(p[0], p[1])
    ctx.lineTo(p[2], p[3])
    ctx.lineTo(p[4], p[5])
    ctx.lineTo(p[6], p[7])
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

/** A soft radial glow, for bloom behind pieces. */
export function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha = 1) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r)
  g.addColorStop(0, color)
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = g
  ctx.fillRect(x - r, y - r, r * 2, r * 2)
  ctx.restore()
}

/** Hex colour with alpha, for canvas strings. */
export const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

/* ------------------------------------------------------------------ sound */

let audio: AudioContext | null = null
/** A soft sine chord. Needs a prior user gesture; silently no-ops otherwise. */
export function chime(freqs: number[], gain = 0.07, length = 1.2) {
  try {
    audio ??= new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    if (audio.state === 'suspended') void audio.resume()
    const now = audio.currentTime
    freqs.forEach((f, i) => {
      const o = audio!.createOscillator()
      const g = audio!.createGain()
      o.type = 'sine'
      o.frequency.value = f
      const t0 = now + i * 0.03
      g.gain.setValueAtTime(0, t0)
      g.gain.linearRampToValueAtTime(gain / (i + 1), t0 + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + length)
      o.connect(g).connect(audio!.destination)
      o.start(t0)
      o.stop(t0 + length + 0.05)
    })
  } catch {
    /* audio unavailable */
  }
}

/* ------------------------------------------------------------------ best */

export function readBest(id: string): number {
  try {
    return Number(localStorage.getItem(`myorbit-game-best:${id}`)) || 0
  } catch {
    return 0
  }
}

export function saveBest(id: string, score: number): number {
  const best = Math.max(readBest(id), score)
  try {
    localStorage.setItem(`myorbit-game-best:${id}`, String(best))
  } catch {
    /* storage blocked */
  }
  return best
}

export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)
export const rand = (a: number, b: number) => a + Math.random() * (b - a)

let fontFamily = ''
/** Canvas font string in the site's typeface. */
export const font = (weight: number, px: number) =>
  `${weight} ${Math.round(px)}px ${(fontFamily ||= getComputedStyle(document.body).fontFamily)}`
