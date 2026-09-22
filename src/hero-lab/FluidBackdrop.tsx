import { useEffect, useRef } from 'react'

/**
 * The hero atmosphere, as a moving fluid instead of a fixed set of radial
 * gradients.
 *
 * Used by the hero sandbox only. The live hero keeps its static .atmosphere.
 *
 * It is not an approximation of the hero's background: it rebuilds the exact
 * `.atmosphere` stack from src/index.css — the same six ellipses, the same
 * centres, radii and alphas, over the same base sheet — and then reads that
 * stack at a displaced point. Nothing about the gradient changes; only where
 * each pixel samples it does. That displacement comes from domain-warped fBm
 * for the ambient drift, plus the pointer wake, which is why the colour is
 * carried along rather than tinted over.
 */

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2  uRes;
uniform float uTime;
/* 1 fades the lower half out, matching the CSS mask on .atmosphere; 0 keeps
   the canvas fully opaque. Done in the shader because a CSS mask over a WebGL
   canvas forces a composited layer the browser does not reliably fill — it
   rendered solid black once scrolled. */
uniform float uBottomFade;

/* Pointer wake. Each impulse is (x, y, strength) in uv space; strength 0
   means the slot is unused. A short trail of them, rather than one blob at
   the cursor, is what makes a drag read as something pushed through liquid
   instead of a spotlight following the mouse. */
#define MAX_IMPULSES 12
#define SWIRL_LIMIT 0.45
/* How far the ambient drift displaces the gradient, in uv units. */
#define FLOW_AMP 0.95
uniform vec3 uImpulses[MAX_IMPULSES];

/* Palette lifted from .hero-lab__atmosphere, unchanged. */
const vec3 PEACH = vec3(1.000, 0.808, 0.729); /* 255,206,186 */
const vec3 PINK  = vec3(1.000, 0.769, 0.886); /* 255,196,226 */
const vec3 BLUE  = vec3(0.659, 0.776, 1.000); /* 168,198,255 */
const vec3 PERI  = vec3(0.722, 0.784, 1.000); /* 184,200,255 */
const vec3 LAV   = vec3(0.769, 0.800, 0.980); /* 196,204,250 */
const vec3 PALE  = vec3(0.839, 0.871, 1.000); /* 214,222,255 */

/* The base sheet: #f5f6fc -> #f2f3fa -> #eceef9 */
const vec3 BASE_TOP = vec3(0.961, 0.965, 0.988);
const vec3 BASE_MID = vec3(0.949, 0.953, 0.980);
const vec3 BASE_BOT = vec3(0.925, 0.933, 0.976);

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

/* Four octaves is enough at this softness, and keeps the warp affordable. */
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

/*
 * One layer of the original CSS stack: an ellipse of constant colour whose
 * alpha ramps linearly to zero at 72% of its radius, which is what
 * "radial-gradient(RX% RY% at CX% CY%, rgba(...), transparent 72%)" does.
 */
vec3 layer(vec3 col, vec3 tint, vec2 uv, vec2 centre, vec2 radii, float alpha) {
  float d = length((uv - centre) / radii);
  return mix(col, tint, alpha * max(0.0, 1.0 - d / 0.72));
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 pos = vec2(uv.x * aspect, uv.y);

  /* Pointer wake: each impulse rotates the sample point around itself with a
     gaussian falloff. The perpendicular's magnitude is |d|, so the swirl
     fades to nothing at the centre rather than spinning about a singularity. */
  vec2 swirl = vec2(0.0);
  for (int i = 0; i < MAX_IMPULSES; i++) {
    vec3 imp = uImpulses[i];
    if (imp.z <= 0.001) continue;
    vec2 d = pos - vec2(imp.x * aspect, imp.y);
    float fall = exp(-dot(d, d) / 0.075);
    swirl += vec2(-d.y, d.x) * fall * imp.z;
  }
  /* Smooth saturation, so overlapping impulses ease toward a ceiling instead
     of compounding into a visible fold. */
  swirl *= SWIRL_LIMIT / (SWIRL_LIMIT + length(swirl));

  /* Ambient drift: domain-warped fBm, centred on zero so it displaces the
     gradient rather than biasing it in one direction. */
  float t = uTime * 0.12;
  vec2 p = pos * 1.55;
  vec2 q = vec2(fbm(p + t * 0.35), fbm(p + vec2(5.2, 1.3) - t * 0.28));
  vec2 warp = vec2(
    fbm(p + 2.6 * q + vec2(1.7, 9.2) + t * 0.22),
    fbm(p + 2.6 * q + vec2(8.3, 2.8) - t * 0.19)
  );
  /* fBm lands in roughly 0.43..0.67, not 0..1, so it is recentred on its own
     median before scaling — subtracting 0.5 leaves almost no displacement. */
  vec2 flow = (warp - 0.57) * FLOW_AMP;

  /* Where the gradient gets read. */
  vec2 wuv = uv + flow + vec2(swirl.x / aspect, swirl.y);

  /* The hero's .atmosphere, layer for layer. CSS paints the first-listed
     background on top, so these are applied bottom-up: the base sheet, then
     each ellipse in reverse order, ending with the white core. The numbers
     are the same percentages and alphas as in src/index.css. */
  vec3 col = mix(BASE_TOP, BASE_MID, smoothstep(0.0, 0.6, wuv.y));
  col = mix(col, BASE_BOT, smoothstep(0.6, 1.0, wuv.y));

  col = layer(col, PALE,  wuv, vec2(0.62, 1.04), vec2(0.40, 0.26), 0.55);
  col = layer(col, LAV,   wuv, vec2(1.00, 0.34), vec2(0.16, 0.40), 0.55);
  col = layer(col, PERI,  wuv, vec2(0.18, 0.92), vec2(0.22, 0.30), 0.55);
  col = layer(col, BLUE,  wuv, vec2(0.02, 0.78), vec2(0.20, 0.36), 0.62);
  col = layer(col, PINK,  wuv, vec2(0.06, 0.60), vec2(0.16, 0.30), 0.50);
  col = layer(col, PEACH, wuv, vec2(0.00, 0.46), vec2(0.18, 0.34), 0.62);
  col = layer(col, vec3(1.0), wuv, vec2(0.50, 0.46), vec2(0.34, 0.44), 0.90);

  /* Dither: these gradients are shallow enough to band on 8-bit displays. */
  col += (hash(gl_FragCoord.xy) - 0.5) / 255.0;

  /* Alpha 1 through the top half, then linear to 0 at the bottom edge — the
     same ramp as linear-gradient(180deg, #000 0%, #000 50%, transparent 100%).
     Premultiplied, because the context requests premultiplied alpha. */
  float fade = mix(1.0, clamp(uv.y / 0.5, 0.0, 1.0), uBottomFade);
  gl_FragColor = vec4(col * fade, fade);
}
`

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('FluidBackdrop shader failed:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

/**
 * The field is soft and low-frequency, so rendering at roughly half
 * resolution and letting the canvas scale up is visually identical and much
 * cheaper — the warp costs about 20 noise lookups per pixel.
 */
const RESOLUTION_SCALE = 0.5

/** Must match MAX_IMPULSES in the shader. */
const MAX_IMPULSES = 12
/** Per-frame survival of an impulse, at 60fps — roughly a 2s tail. */
const IMPULSE_DECAY = 0.972
/** How fast the tracked pointer chases the real one. Lower is smoother. */
const POINTER_EASE = 0.14
/** Minimum travel between impulses, so the trail is evenly spaced however
 *  many pointermove events the browser happens to fire. */
const MIN_STEP = 0.022
/** Smoothed per-frame speed that counts as a full-strength push. */
const FULL_PUSH = 0.016

type Impulse = { x: number; y: number; strength: number }

export default function FluidBackdrop({
  className,
  bottomFade = false,
}: {
  className?: string
  /** Fade the lower half out, for a hero that has a section beneath it. */
  bottomFade?: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // alpha: true matters. With an opaque context the drawing buffer clears
    // to solid black, so any frame composited between the clear and the draw
    // shows black — which a CSS mask over the canvas makes very visible. With
    // alpha, an undrawn buffer is transparent and the static .atmosphere
    // gradient underneath shows through instead. The shader writes alpha 1,
    // so a drawn frame is still fully opaque.
    const gl = canvas.getContext('webgl', {
      antialias: false,
      alpha: true,
      premultipliedAlpha: true,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
    })
    // No WebGL: the CSS gradient underneath stays visible, so there is
    // nothing to fall back to explicitly.
    if (!gl) return

    const vs = compile(gl, gl.VERTEX_SHADER, VERT)
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) return

    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('FluidBackdrop link failed:', gl.getProgramInfoLog(program))
      return
    }
    gl.useProgram(program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(program, 'aPos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(program, 'uRes')
    const uTime = gl.getUniformLocation(program, 'uTime')
    const uImpulses = gl.getUniformLocation(program, 'uImpulses[0]')
    gl.uniform1f(gl.getUniformLocation(program, 'uBottomFade'), bottomFade ? 1 : 0)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

    // Flat (x, y, strength) triples, uploaded every frame.
    const impulseData = new Float32Array(MAX_IMPULSES * 3)
    const impulses: Impulse[] = []
    // Raw pointer, written by events; everything else advances once a frame.
    let target: { x: number; y: number } | null = null
    let tracked: { x: number; y: number } | null = null
    let lastSeed: { x: number; y: number } | null = null
    let speed = 0

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const start = performance.now()

    /**
     * Advance the pointer trail. Emission is deliberately decoupled from
     * pointermove events: the browser fires those at wildly varying rates,
     * and seeding an impulse per event bunched them up and compounded the
     * displacement. One smoothed step per frame, spaced by distance, gives
     * an even wake regardless of how the events arrive.
     */
    const advancePointer = () => {
      if (!target) return
      if (!tracked) {
        tracked = { ...target }
        lastSeed = { ...target }
        return
      }
      const dx = target.x - tracked.x
      const dy = target.y - tracked.y
      tracked.x += dx * POINTER_EASE
      tracked.y += dy * POINTER_EASE
      // Exponentially smoothed speed, so strength never jumps between frames.
      speed = speed * 0.86 + Math.hypot(dx * POINTER_EASE, dy * POINTER_EASE) * 0.14

      if (!lastSeed) lastSeed = { ...tracked }
      const moved = Math.hypot(tracked.x - lastSeed.x, tracked.y - lastSeed.y)
      if (moved >= MIN_STEP) {
        impulses.push({
          x: tracked.x,
          y: tracked.y,
          strength: Math.min(1, speed / FULL_PUSH),
        })
        lastSeed = { x: tracked.x, y: tracked.y }
        while (impulses.length > MAX_IMPULSES) impulses.shift()
      }
    }

    const draw = (time: number) => {
      advancePointer()

      // Decay first, then retire anything faded out. Oldest sit at the
      // front, so shift() removes them in order.
      for (const imp of impulses) imp.strength *= IMPULSE_DECAY
      while (impulses.length && impulses[0].strength < 0.01) impulses.shift()

      impulseData.fill(0)
      for (let i = 0; i < impulses.length && i < MAX_IMPULSES; i++) {
        const imp = impulses[i]
        impulseData[i * 3] = imp.x
        impulseData[i * 3 + 1] = imp.y
        impulseData[i * 3 + 2] = imp.strength
      }
      gl.uniform3fv(uImpulses, impulseData)

      gl.uniform1f(uTime, time)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      const x = (e.clientX - rect.left) / rect.width
      // Shader uv has y running up; the DOM has it running down.
      const y = 1 - (e.clientY - rect.top) / rect.height
      if (x < -0.1 || x > 1.1 || y < -0.1 || y > 1.1) return
      target = { x, y }

      // A pointer moving over a still page has to restart the loop.
      if (!running && !document.hidden && !reduced) {
        running = true
        loop()
      }
    }

    const onPointerLeave = () => {
      target = null
      tracked = null
      lastSeed = null
      speed = 0
    }

    const resize = () => {
      const w = Math.max(1, Math.round(canvas.clientWidth * RESOLUTION_SCALE))
      const h = Math.max(1, Math.round(canvas.clientHeight * RESOLUTION_SCALE))
      if (canvas.width === w && canvas.height === h) return
      canvas.width = w
      canvas.height = h
      gl.viewport(0, 0, w, h)
      gl.uniform2f(uRes, w, h)
      // Repaint immediately so a resize never shows a stale or blank frame,
      // which matters when the loop is not running.
      draw(reduced ? 0 : (performance.now() - start) / 1000)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    let frame = 0
    let running = !reduced

    const loop = () => {
      if (!running) return
      draw((performance.now() - start) / 1000)
      frame = requestAnimationFrame(loop)
    }

    resize()
    if (reduced) draw(0)
    else loop()

    // Stop burning frames on a background tab.
    const onVisibility = () => {
      if (reduced) return
      if (document.hidden) {
        running = false
        cancelAnimationFrame(frame)
      } else if (!running) {
        running = true
        loop()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    if (!reduced) {
      // Listen on the window rather than the canvas: the canvas sits behind
      // the ribbon and the headline with pointer-events: none, so it never
      // receives these itself.
      window.addEventListener('pointermove', onPointerMove, { passive: true })
      window.addEventListener('pointerleave', onPointerLeave, { passive: true })
    }

    return () => {
      running = false
      cancelAnimationFrame(frame)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerleave', onPointerLeave)
      observer.disconnect()
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      // Deliberately NOT calling WEBGL_lose_context here. StrictMode runs
      // effects twice in dev, and a lost context stays lost — getContext()
      // hands back the same dead object on remount, leaving an opaque canvas
      // covering the page. The context is released with the canvas anyway.
    }
  }, [bottomFade])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}
