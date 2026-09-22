import { useEffect, useRef, type CSSProperties, type RefObject } from 'react'

/**
 * The hero's `.atmosphere`, as a fluid.
 *
 * The gradients are the exact stack from `.atmosphere` in src/index.css — the
 * same ellipses, centres, radii, colours and stops over the same base sheet,
 * with the same bottom fade. A fragment shader evaluates that stack per pixel,
 * which is what lets the cursor displace it locally:
 *
 *  - Ambient: every ellipse drifts and stretches on slow, never-repeating
 *    sines (computed here on the CPU and passed in as uniforms).
 *  - Cursor: while hovering, the fluid is pushed out of a soft region around
 *    the pointer, so the colours part around it.
 *  - Wake: moving the pointer drags the fluid along behind it; each trail
 *    point relaxes on its own, so the colour flows back into place.
 *  - Leaving: the push around the cursor is released on an under-damped
 *    spring, so the fluid settles back with a little wobble.
 *
 * The static DOM layers underneath are the paint-time, reduced-motion and
 * no-WebGL fallback; they paint the identical picture, standing still.
 */

type Layer = {
  /** Ellipse radii and centre, in % of the hero — copied from .atmosphere. */
  rx: number
  ry: number
  cx: number
  cy: number
  /** 0–255 colour and alpha, copied from .atmosphere. */
  rgba: [number, number, number, number]
  stop: number
  /** Drift amplitude (vw, vh). */
  amp: [number, number]
  /** Stretch amplitude, as a fraction of size. */
  stretch: number
  /** Phase seed, so no two layers move in step. */
  seed: number
}

/* Listed bottom-to-top (the reverse of the CSS list, where first is on top). */
const LAYERS: Layer[] = [
  { rx: 40, ry: 26, cx: 62, cy: 104, rgba: [214, 222, 255, 0.55], stop: 70, amp: [12, 7], stretch: 0.16, seed: 0.7 },
  { rx: 16, ry: 40, cx: 100, cy: 34, rgba: [196, 204, 250, 0.55], stop: 72, amp: [9, 12], stretch: 0.22, seed: 2.1 },
  { rx: 22, ry: 30, cx: 18, cy: 92, rgba: [184, 200, 255, 0.55], stop: 72, amp: [11, 8], stretch: 0.2, seed: 3.4 },
  { rx: 20, ry: 36, cx: 2, cy: 78, rgba: [168, 198, 255, 0.62], stop: 72, amp: [10, 11], stretch: 0.22, seed: 4.8 },
  { rx: 16, ry: 30, cx: 6, cy: 60, rgba: [255, 196, 226, 0.5], stop: 72, amp: [12, 10], stretch: 0.25, seed: 5.9 },
  { rx: 18, ry: 34, cx: 0, cy: 46, rgba: [255, 206, 186, 0.62], stop: 72, amp: [11, 10], stretch: 0.22, seed: 1.3 },
  { rx: 34, ry: 44, cx: 50, cy: 46, rgba: [255, 255, 255, 0.9], stop: 72, amp: [5, 5], stretch: 0.1, seed: 6.6 },
]

/* Phase units per second for the ambient drift. Higher is faster. */
const TEMPO = 0.22
/* Radius of the cursor's push, as a fraction of the hero's shorter side. */
const PUSH_RADIUS = 0.3
/* How hard the cursor pushes (0–1; at 1 the fluid would fold over itself). */
const PUSH = 0.8
/* Wake: radius (fraction of shorter side), gain, and relax time (s). */
const WAKE_RADIUS = 0.22
const WAKE_GAIN = 1.1
const WAKE_RELAX = 1.1
/* Release spring for the cursor push: stiffness (rad/s) and damping ratio.
   Under 1 overshoots slightly, which reads as the fluid sloshing back. */
const SPRING_W = 5.5
const SPRING_Z = 0.45
/* Render scale: the field is all soft gradients, so it doesn't need full
   resolution; this keeps it cheap on large and high-DPR screens. */
const RES = 0.6
const MAX_WAKE = 20

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

const FRAG = `
precision highp float;

#define N_LAYERS ${LAYERS.length}
#define MAX_WAKE ${MAX_WAKE}

uniform vec2 uRes;                 /* hero size, CSS px */
uniform float uScale;              /* canvas px per CSS px */
uniform vec4 uGeom[N_LAYERS];      /* centre (uv), radii (uv) */
uniform vec4 uColor[N_LAYERS];     /* rgb 0–1, alpha */
uniform float uStop[N_LAYERS];     /* transparent stop, 0–1 */
uniform vec3 uCursor;              /* x, y (px), push strength */
uniform vec4 uWake[MAX_WAKE];      /* x, y (px), dx, dy (px) */
uniform float uWakeS[MAX_WAKE];    /* strength 0–1 */
uniform float uPushR;              /* px */
uniform float uWakeR;              /* px */

const vec3 BASE_TOP = vec3(0.961, 0.965, 0.988); /* #f5f6fc */
const vec3 BASE_MID = vec3(0.949, 0.953, 0.980); /* #f2f3fa */
const vec3 BASE_BOT = vec3(0.925, 0.933, 0.976); /* #eceef9 */

vec3 stack(vec2 uv) {
  float y = clamp(uv.y, 0.0, 1.0);
  vec3 col = y < 0.6
    ? mix(BASE_TOP, BASE_MID, y / 0.6)
    : mix(BASE_MID, BASE_BOT, (y - 0.6) / 0.4);
  for (int i = 0; i < N_LAYERS; i++) {
    vec2 d = (uv - uGeom[i].xy) / uGeom[i].zw;
    float t = length(d);
    /* CSS interpolates to 'transparent' in premultiplied space, so the hue
       holds and only the alpha falls off linearly to the stop. */
    float a = uColor[i].a * clamp(1.0 - t / uStop[i], 0.0, 1.0);
    col = mix(col, uColor[i].rgb, a);
  }
  return col;
}

void main() {
  /* CSS px, origin top-left, y down — the space every uniform is in. */
  vec2 p = vec2(gl_FragCoord.x / uScale, uRes.y - gl_FragCoord.y / uScale);
  vec2 disp = vec2(0.0);

  /* Cursor push. d * gaussian is smooth through the centre and, with
     PUSH < 1, never folds; sampling at p - disp moves colour outward. */
  vec2 dc = p - uCursor.xy;
  disp += dc * ${PUSH.toFixed(3)} * exp(-dot(dc, dc) / (uPushR * uPushR)) * uCursor.z;

  /* Wake: each trail point drags the fluid by the pointer's movement. */
  for (int i = 0; i < MAX_WAKE; i++) {
    if (uWakeS[i] <= 0.0) continue;
    vec2 dw = p - uWake[i].xy;
    disp += uWake[i].zw * exp(-dot(dw, dw) / (uWakeR * uWakeR)) * uWakeS[i];
  }

  vec3 col = stack((p - disp) / uRes);

  /* Same bottom fade as the CSS mask on .atmosphere, on screen position. */
  float y = p.y / uRes.y;
  float fade = y < 0.5 ? 1.0 : 1.0 - (y - 0.5) / 0.5;

  /* A touch of noise so the soft gradient doesn't band. */
  float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
  col += n / 255.0;

  gl_FragColor = vec4(col * fade, fade);
}
`

/* Static layers: exact CSS equivalents, used as fallback and first paint. */
function layerStyle(l: Layer): CSSProperties {
  const [r, g, b, a] = l.rgba
  return {
    background: `radial-gradient(${l.rx}% ${l.ry}% at ${l.cx}% ${l.cy}%, rgba(${r}, ${g}, ${b}, ${a}), transparent ${l.stop}%)`,
  }
}

type Props = {
  /** The element whose hover drives the field (the hero section). */
  targetRef: RefObject<HTMLElement | null>
  reducedMotion: boolean
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.warn('[AnimatedAtmosphere]', gl.getShaderInfoLog(s))
    return null
  }
  return s
}

export default function AnimatedAtmosphere({ targetRef, reducedMotion }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const el = targetRef.current
    const canvas = canvasRef.current
    if (!el || !canvas || reducedMotion) return

    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: false })
    if (!gl) return
    const vs = compile(gl, gl.VERTEX_SHADER, VERT)
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) return
    const prog = gl.createProgram()!
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'aPos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const u = (name: string) => gl.getUniformLocation(prog, name)
    const uRes = u('uRes')
    const uScale = u('uScale')
    const uGeom = u('uGeom')
    const uCursor = u('uCursor')
    const uWake = u('uWake')
    const uWakeS = u('uWakeS')
    const uPushR = u('uPushR')
    const uWakeR = u('uWakeR')

    gl.uniform4fv(
      u('uColor'),
      new Float32Array(LAYERS.flatMap((l) => [l.rgba[0] / 255, l.rgba[1] / 255, l.rgba[2] / 255, l.rgba[3]])),
    )
    gl.uniform1fv(u('uStop'), new Float32Array(LAYERS.map((l) => l.stop / 100)))

    /* Hero size in CSS px (the shader's coordinate space). */
    let W = 1
    let H = 1
    const resize = () => {
      const r = canvas.getBoundingClientRect()
      W = Math.max(1, r.width)
      H = Math.max(1, r.height)
      const scale = Math.min(window.devicePixelRatio || 1, 2) * RES
      canvas.width = Math.round(W * scale)
      canvas.height = Math.round(H * scale)
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    /* Pointer state, in CSS px within the hero. */
    const ptr = { x: W / 2, y: H / 2, inside: false }
    const cursor = { x: W / 2, y: H / 2 }
    /* Push strength runs on a spring so release sloshes back. */
    const push = { v: 0, vel: 0 }
    type Wake = { x: number; y: number; dx: number; dy: number; age: number }
    const wake: Wake[] = []
    let lastSpawn = { x: 0, y: 0, has: false }

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      ptr.x = e.clientX - r.left
      ptr.y = e.clientY - r.top
      if (!ptr.inside) {
        /* Enter where the pointer is rather than sliding in from the last exit. */
        cursor.x = ptr.x
        cursor.y = ptr.y
        lastSpawn = { x: ptr.x, y: ptr.y, has: true }
      }
      ptr.inside = true

      const dx = ptr.x - lastSpawn.x
      const dy = ptr.y - lastSpawn.y
      if (lastSpawn.has && dx * dx + dy * dy > 36) {
        wake.push({ x: ptr.x, y: ptr.y, dx: dx * WAKE_GAIN, dy: dy * WAKE_GAIN, age: 0 })
        if (wake.length > MAX_WAKE) wake.shift()
        lastSpawn = { x: ptr.x, y: ptr.y, has: true }
      }
    }
    const onLeave = () => {
      ptr.inside = false
      lastSpawn.has = false
    }

    const geom = new Float32Array(LAYERS.length * 4)
    const wakeBuf = new Float32Array(MAX_WAKE * 4)
    const wakeS = new Float32Array(MAX_WAKE)

    let visible = true
    let raf = 0
    let last = performance.now()
    let t = 0

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      if (!visible) return
      t += dt * TEMPO

      /* Ambient drift, identical to moving and stretching each ellipse. */
      const vw = window.innerWidth / 100
      const vh = window.innerHeight / 100
      LAYERS.forEach((l, i) => {
        const s = l.seed
        const dx = (Math.sin(t + s) * 0.62 + Math.sin(t * 1.73 + s * 2.3) * 0.38) * l.amp[0] * vw
        const dy = (Math.cos(t * 0.87 + s * 1.7) * 0.6 + Math.sin(t * 1.41 + s * 0.6) * 0.4) * l.amp[1] * vh
        const sx = 1 + Math.sin(t * 1.21 + s * 3.1) * l.stretch
        const sy = 1 + Math.cos(t * 1.07 + s * 1.9) * l.stretch
        geom[i * 4] = l.cx / 100 + dx / W
        geom[i * 4 + 1] = l.cy / 100 + dy / H
        geom[i * 4 + 2] = (l.rx / 100) * sx
        geom[i * 4 + 3] = (l.ry / 100) * sy
      })

      /* The push centre trails the pointer a little, like something moving
         through liquid rather than a cursor-locked stamp. */
      const kc = 1 - Math.exp(-dt * 9)
      cursor.x += (ptr.x - cursor.x) * kc
      cursor.y += (ptr.y - cursor.y) * kc

      /* Damped spring toward 1 while inside, 0 once the pointer leaves. */
      const goal = ptr.inside ? 1 : 0
      const acc = SPRING_W * SPRING_W * (goal - push.v) - 2 * SPRING_Z * SPRING_W * push.vel
      push.vel += acc * dt
      push.v += push.vel * dt

      /* Wake points ease in fast, then relax back to nothing. */
      for (let i = wake.length - 1; i >= 0; i--) {
        wake[i].age += dt
        if (wake[i].age > WAKE_RELAX * 5) wake.splice(i, 1)
      }
      wakeS.fill(0)
      wake.forEach((w, i) => {
        wakeBuf[i * 4] = w.x
        wakeBuf[i * 4 + 1] = w.y
        wakeBuf[i * 4 + 2] = w.dx
        wakeBuf[i * 4 + 3] = w.dy
        wakeS[i] = (1 - Math.exp(-w.age / 0.06)) * Math.exp(-w.age / WAKE_RELAX)
      })

      const minSide = Math.min(W, H)
      gl.uniform2f(uRes, W, H)
      gl.uniform1f(uScale, canvas.width / W)
      gl.uniform4fv(uGeom, geom)
      gl.uniform3f(uCursor, cursor.x, cursor.y, push.v)
      gl.uniform4fv(uWake, wakeBuf)
      gl.uniform1fv(uWakeS, wakeS)
      gl.uniform1f(uPushR, minSide * PUSH_RADIUS)
      gl.uniform1f(uWakeR, minSide * WAKE_RADIUS)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
    })
    io.observe(el)
    el.addEventListener('pointermove', onMove, { passive: true })
    el.addEventListener('pointerleave', onLeave)
    raf = requestAnimationFrame(frame)
    canvas.style.opacity = '1'

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      canvas.style.opacity = '0'
    }
  }, [targetRef, reducedMotion])

  return (
    <>
      <div className="hero-anim__atmosphere" aria-hidden="true">
        <div className="hero-anim__base" />
        {LAYERS.map((l, i) => (
          <div key={i} className="hero-anim__layer" style={layerStyle(l)} />
        ))}
      </div>
      <canvas ref={canvasRef} className="hero-anim__fluid" aria-hidden="true" />
    </>
  )
}
