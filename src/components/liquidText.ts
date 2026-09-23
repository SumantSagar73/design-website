import { useEffect, type RefObject } from 'react'

/**
 * Hover-liquid text: the words are drawn into a texture and rendered by a
 * shader that bends them under the cursor — the same push / wake / spring
 * model as the hero's fluid backdrop (src/hero-animated/AnimatedAtmosphere.tsx)
 * — and splits their colour channels in proportion to how far each pixel is
 * displaced. Untouched, it is pixel-for-pixel the plain text.
 *
 * The real DOM text stays underneath (transparent once WebGL is up) so it
 * still selects, reads to screen readers and drives the layout.
 *
 * Shared by the live Design Philosophy section and the philosophy lab's
 * variant gallery (src/philosophy-lab/glitch.tsx).
 */

export type LiquidConfig = {
  /** Cursor bulge strength (0–1; near 1 folds) and radius (px). */
  push: number
  pushRadius: number
  /** Channel split as a fraction of displacement. */
  split: number
  /** Minimum split near the cursor even where displacement is small (px). */
  splitFloor: number
  /** Wake: gain on pointer movement, radius (px), relax time (s). */
  wake: number
  wakeRadius: number
  wakeRelax: number
  /** Release spring damping ratio (lower sloshes more). */
  springZ: number
  /** Scroll velocity shears the text into a wave. */
  shear: number
  /** Digital slice offsets near the cursor. */
  slices: number
  /** Fringe colours: 'rgb' splits channels; 'brand' tints indigo / peach. */
  palette: 'rgb' | 'brand'
  /** Scroll-driven word reveal, matching the live Design Philosophy section. */
  reveal: boolean
}

export const LIQUID_BASE: LiquidConfig = {
  push: 0.62,
  pushRadius: 150,
  split: 0.32,
  splitFloor: 0,
  wake: 1.1,
  wakeRadius: 90,
  wakeRelax: 0.7,
  springZ: 0.42,
  shear: 0,
  slices: 0,
  palette: 'rgb',
  reveal: false,
}

/**
 * "Minimal liquid": reveals on scroll exactly like the live section, then a
 * pure fish-eye on hover — the text swells under the cursor and eases back.
 * About a third of the lens's bend, no colour split, a short soft wake, and
 * near-critical damping so the release settles instead of sloshing.
 */
export const LIQUID_MINIMAL: Partial<LiquidConfig> = {
  push: 0.28,
  pushRadius: 130,
  split: 0,
  splitFloor: 0,
  wake: 0.45,
  wakeRadius: 70,
  wakeRelax: 0.5,
  springZ: 0.8,
  reveal: true,
}

/** Canvas overhang around the text, so bends aren't clipped. */
export const LIQUID_PAD = 70
const MAX_WAKE = 16

const VERT = `attribute vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`

const FRAG = `
precision highp float;
#define MAX_WAKE ${MAX_WAKE}
uniform sampler2D uTex;
uniform vec2 uRes;          /* canvas size, CSS px */
uniform float uScale;       /* canvas px per CSS px */
uniform vec3 uCursor;       /* x, y, strength */
uniform vec4 uWake[MAX_WAKE];
uniform float uWakeS[MAX_WAKE];
uniform float uPush, uPushR, uWakeR, uSplit, uSplitFloor, uTime, uShear, uSlice, uBrand;

const vec3 INK = vec3(0.043, 0.055, 0.094);   /* #0b0e18 */
const vec3 TINT_A = vec3(0.35, 0.37, 0.84);   /* indigo */
const vec3 TINT_B = vec3(1.0, 0.62, 0.50);    /* peach */

float hash(vec2 v) { return fract(sin(dot(v, vec2(12.9898, 78.233))) * 43758.5453); }

float A(vec2 p) {
  vec2 uv = p / uRes;
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return 0.0;
  return texture2D(uTex, uv).a;
}

void main() {
  vec2 p = vec2(gl_FragCoord.x / uScale, uRes.y - gl_FragCoord.y / uScale);
  vec2 disp = vec2(0.0);

  /* Bulge: sampling toward the cursor magnifies what's under it. */
  vec2 dc = p - uCursor.xy;
  float near = exp(-dot(dc, dc) / (uPushR * uPushR)) * uCursor.z;
  disp += dc * uPush * near;

  /* Wake: drag the text along the pointer's path. */
  for (int i = 0; i < MAX_WAKE; i++) {
    if (uWakeS[i] <= 0.0) continue;
    vec2 dw = p - uWake[i].xy;
    disp += uWake[i].zw * exp(-dot(dw, dw) / (uWakeR * uWakeR)) * uWakeS[i];
  }

  /* Scroll shear: a travelling wave whose height follows scroll speed. */
  disp.x += sin(p.y * 0.05 + uTime * 7.0) * uShear * 22.0;

  /* Digital slices: random rows near the cursor jump sideways. */
  if (uSlice > 0.0) {
    float row = floor(p.y / 9.0);
    float tick = floor(uTime * 14.0);
    if (hash(vec2(row, tick)) > 0.72) {
      disp.x += (hash(vec2(row * 1.7, tick + 3.1)) - 0.5) * 70.0 * uSlice * near;
    }
  }

  /* Split grows with displacement, so the fringes live where it bends. */
  vec2 off = disp * uSplit;
  float floorAmt = uSplitFloor * near + uShear * 6.0;
  off += vec2(floorAmt, 0.0);

  vec2 q = p - disp;
  float a0 = A(q);
  float aL = A(q - off);
  float aR = A(q + off);

  vec3 col;
  if (uBrand > 0.5) {
    col = vec3(1.0);
    col = mix(col, TINT_A, aL * (1.0 - a0) * 0.95);
    col = mix(col, TINT_B, aR * (1.0 - a0) * 0.95);
    col = mix(col, INK, a0);
  } else {
    /* Per-channel ink on white: all three agree -> ink; apart -> CMY fringes. */
    vec3 cover = vec3(aL, a0, aR);
    col = 1.0 - cover * (1.0 - INK);
  }
  /* Transparent where there's no ink, so the canvas can overhang the
     eyebrow above. Premultiplied so it composites exactly over white. */
  float alpha = max(max(aL, a0), aR);
  gl_FragColor = vec4(clamp(col - (1.0 - alpha), 0.0, 1.0), alpha);
}
`

export type LiquidRefs = {
  /** Listens for pointer moves — usually the whole section. */
  sectionRef: RefObject<HTMLElement | null>
  /** Gets `is-gl` once the shader is drawing, hiding the DOM text. */
  wrapRef: RefObject<HTMLElement | null>
  /** The heading whose `[data-w]` spans are rasterised. */
  textRef: RefObject<HTMLElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
  /** Drives the scroll reveal; defaults to the text element itself. */
  containerRef?: RefObject<HTMLElement | null>
}

export function useLiquidText(refs: LiquidRefs, config: Partial<LiquidConfig>) {
  const { sectionRef, wrapRef, textRef, canvasRef, containerRef } = refs

  useEffect(() => {
    const cfg = { ...LIQUID_BASE, ...config }
    const section = sectionRef.current
    const wrap = wrapRef.current
    const text = textRef.current
    const canvas = canvasRef.current
    if (!section || !wrap || !text || !canvas) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: true })
    if (!gl) return
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(s))
      return s
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
    gl.useProgram(prog)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'aPos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)
    const u = (n: string) => gl.getUniformLocation(prog, n)
    const U = {
      res: u('uRes'), scale: u('uScale'), cursor: u('uCursor'), wake: u('uWake'), wakeS: u('uWakeS'),
      push: u('uPush'), pushR: u('uPushR'), wakeR: u('uWakeR'), split: u('uSplit'),
      splitFloor: u('uSplitFloor'), time: u('uTime'), shear: u('uShear'), slice: u('uSlice'), brand: u('uBrand'),
    }

    const tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    const paint = document.createElement('canvas')
    const pctx = paint.getContext('2d')!

    let W = 1
    let H = 1
    let dirty = true

    /* Where each word sits, measured from the DOM (canvas px, PAD included). */
    type Placed = { text: string; x: number; baseline: number }
    let placed: Placed[] = []
    let revealP = -1 // last reveal progress painted; -1 forces a paint

    /* Scroll reveal, same as the live section: each word goes from 15% to
       full ink and rises 5px, in reading order, between the container
       entering at the bottom and reaching the centre. */
    const revealAt = (p: number, i: number) => {
      if (!cfg.reveal) return 1
      const n = placed.length
      const start = i / n
      const end = Math.min(start + 1.2 / n, 1)
      return Math.min(Math.max((p - start) / (end - start), 0), 1)
    }

    const paintText = (p: number) => {
      const dpr = paint.width / W
      pctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      pctx.clearRect(0, 0, W, H)
      placed.forEach((w, i) => {
        const t = revealAt(p, i)
        pctx.globalAlpha = 0.15 + 0.85 * t
        pctx.fillText(w.text, w.x, w.baseline + 5 * (1 - t))
      })
      pctx.globalAlpha = 1
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, paint)
      revealP = p
      dirty = true
    }

    const rebuild = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      /* Size the canvas from the heading itself. It is capped by max-width, so
         it can be narrower than its wrapper; sizing the canvas from the
         wrapper stretched the text sideways. */
      W = text.offsetWidth + LIQUID_PAD * 2
      H = text.offsetHeight + LIQUID_PAD * 2
      canvas.style.width = `${W}px`
      canvas.style.height = `${H}px`
      canvas.width = paint.width = Math.round(W * dpr)
      canvas.height = paint.height = Math.round(H * dpr)
      gl.viewport(0, 0, canvas.width, canvas.height)

      const cs = getComputedStyle(text)
      const lineH = parseFloat(cs.lineHeight)
      pctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
      ;(pctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = cs.letterSpacing
      pctx.fillStyle = '#fff'
      pctx.textBaseline = 'alphabetic'
      const m = pctx.measureText('Hg')
      const asc = m.fontBoundingBoxAscent
      const desc = m.fontBoundingBoxDescent
      placed = [...text.querySelectorAll<HTMLElement>('[data-w]')].map((s) => ({
        text: s.textContent ?? '',
        x: s.offsetLeft + LIQUID_PAD,
        /* Baseline inside a line box: half-leading above the font's box. */
        baseline: s.offsetTop + (lineH - (asc + desc)) / 2 + asc + LIQUID_PAD,
      }))
      paintText(revealP < 0 ? readReveal() : revealP)
    }

    /* Reveal progress of the text container, 0 (entering) to 1 (centred). */
    const container = containerRef?.current ?? text
    const readReveal = () => {
      if (!cfg.reveal) return 1
      const r = container.getBoundingClientRect()
      const vh = window.innerHeight
      return Math.min(Math.max((vh - r.top) / (vh / 2 + r.height / 2), 0), 1)
    }
    rebuild()
    document.fonts?.ready.then(rebuild)
    const ro = new ResizeObserver(rebuild)
    ro.observe(text)
    wrap.classList.add('is-gl')

    /* Pointer, eased push centre, spring strength, wake trail. */
    const ptr = { x: 0, y: 0, inside: false }
    const cur = { x: 0, y: 0 }
    const push = { v: 0, vel: 0 }
    type Wake = { x: number; y: number; dx: number; dy: number; age: number }
    const trail: Wake[] = []
    let last = { x: 0, y: 0, has: false }
    const toLocal = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      return { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    const onMove = (e: PointerEvent) => {
      const p = toLocal(e)
      ptr.x = p.x
      ptr.y = p.y
      if (!ptr.inside) {
        cur.x = p.x
        cur.y = p.y
        last = { x: p.x, y: p.y, has: true }
      }
      ptr.inside = true
      const dx = p.x - last.x
      const dy = p.y - last.y
      if (last.has && dx * dx + dy * dy > 25) {
        trail.push({ x: p.x, y: p.y, dx: dx * cfg.wake, dy: dy * cfg.wake, age: 0 })
        if (trail.length > MAX_WAKE) trail.shift()
        last = { x: p.x, y: p.y, has: true }
      }
    }
    const onLeave = () => {
      ptr.inside = false
      last.has = false
    }
    section.addEventListener('pointermove', onMove, { passive: true })
    section.addEventListener('pointerleave', onLeave)

    let visible = true
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(section)

    const wakeBuf = new Float32Array(MAX_WAKE * 4)
    const wakeS = new Float32Array(MAX_WAKE)
    let lastScroll = window.scrollY
    let shear = 0
    let t = 0
    let prev = performance.now()
    let raf = 0
    const W_SPRING = 7

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min((now - prev) / 1000, 0.1)
      prev = now
      if (!visible) return
      t += dt

      const kc = 1 - Math.exp(-dt * 12)
      cur.x += (ptr.x - cur.x) * kc
      cur.y += (ptr.y - cur.y) * kc
      const goal = ptr.inside ? 1 : 0
      push.vel += (W_SPRING * W_SPRING * (goal - push.v) - 2 * cfg.springZ * W_SPRING * push.vel) * dt
      push.v += push.vel * dt

      for (let i = trail.length - 1; i >= 0; i--) {
        trail[i].age += dt
        if (trail[i].age > cfg.wakeRelax * 5) trail.splice(i, 1)
      }
      wakeS.fill(0)
      trail.forEach((w, i) => {
        wakeBuf.set([w.x, w.y, w.dx, w.dy], i * 4)
        wakeS[i] = (1 - Math.exp(-w.age / 0.05)) * Math.exp(-w.age / cfg.wakeRelax)
      })

      if (cfg.reveal) {
        const p = readReveal()
        if (Math.abs(p - revealP) > 0.0005) paintText(p)
      }

      const sy = window.scrollY
      const speed = Math.min(Math.abs(sy - lastScroll) / Math.max(dt, 0.001) / 2500, 1)
      lastScroll = sy
      shear += (speed * cfg.shear - shear) * (1 - Math.exp(-dt * 6))

      /* Skip the draw once everything has settled back to plain text. */
      const active = Math.abs(push.v) > 0.002 || Math.abs(push.vel) > 0.002 || trail.length > 0 || shear > 0.002
      if (!active && !dirty) return
      dirty = active

      gl.uniform2f(U.res, W, H)
      gl.uniform1f(U.scale, canvas.width / W)
      gl.uniform3f(U.cursor, cur.x, cur.y, push.v)
      gl.uniform4fv(U.wake, wakeBuf)
      gl.uniform1fv(U.wakeS, wakeS)
      gl.uniform1f(U.push, cfg.push)
      gl.uniform1f(U.pushR, cfg.pushRadius)
      gl.uniform1f(U.wakeR, cfg.wakeRadius)
      gl.uniform1f(U.split, cfg.split)
      gl.uniform1f(U.splitFloor, cfg.splitFloor)
      gl.uniform1f(U.time, t)
      gl.uniform1f(U.shear, shear)
      gl.uniform1f(U.slice, cfg.slices)
      gl.uniform1f(U.brand, cfg.palette === 'brand' ? 1 : 0)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      section.removeEventListener('pointermove', onMove)
      section.removeEventListener('pointerleave', onLeave)
      wrap.classList.remove('is-gl')
    }
    // Config is fixed per mount; variants remount on switch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
