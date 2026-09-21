import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion'
import ribbonUrl from '../assets/backgorun-ribbon.png'
import type { InteractionMode } from '../types'

const MAX_RIPPLES = 10
const RIPPLE_LIFE = 2.2 // seconds
const EASE = [0.22, 1, 0.36, 1] as const

type Ripples = {
  list: THREE.Vector4[]
  next: number
  clock: number
  pointer: THREE.Vector2
  pointerSpeed: number
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D uTex;
  uniform float uTime;
  uniform float uAspect;
  uniform vec2 uTexel;
  uniform int uMode;
  uniform vec2 uPointer;
  uniform float uPointerSpeed;
  uniform vec4 uRipples[${MAX_RIPPLES}];
  varying vec2 vUv;

  float erodedAlpha(vec2 uv) {
    vec2 o = uTexel * 2.5;
    float a = texture2D(uTex, uv).a;
    a = min(a, texture2D(uTex, uv + vec2(o.x, 0.0)).a);
    a = min(a, texture2D(uTex, uv - vec2(o.x, 0.0)).a);
    a = min(a, texture2D(uTex, uv + vec2(0.0, o.y)).a);
    a = min(a, texture2D(uTex, uv - vec2(0.0, o.y)).a);
    return a;
  }

  void main() {
    vec2 disp = vec2(0.0);
    vec3 extraGlow = vec3(0.0);

    if (uMode == 0) {
      // 01: Liquid Ripples (Fluid expanding water waves)
      for (int i = 0; i < ${MAX_RIPPLES}; i++) {
        vec4 r = uRipples[i];
        float age = uTime - r.z;
        if (r.w <= 0.0 || age < 0.0 || age > ${RIPPLE_LIFE.toFixed(1)}) continue;
        vec2 d = vUv - r.xy;
        d.x *= uAspect;
        float dist = length(d);
        float front = dist - age * 0.3;
        float fade = 1.0 - age / ${RIPPLE_LIFE.toFixed(1)};
        float wave = sin(front * 70.0) * exp(-front * front * 240.0) * fade * fade * r.w;
        vec2 dir = d / max(dist, 1e-4);
        dir.x /= uAspect;
        disp += dir * wave * 0.011;
      }
    } else if (uMode == 1) {
      // 02: Prismatic Caustics (Lens flares & rainbow dispersion)
      vec2 dP = vUv - uPointer;
      dP.x *= uAspect;
      float pDist = length(dP);

      for (int i = 0; i < ${MAX_RIPPLES}; i++) {
        vec4 r = uRipples[i];
        float age = uTime - r.z;
        if (r.w <= 0.0 || age < 0.0 || age > 2.0) continue;
        vec2 d = (vUv - r.xy) * vec2(uAspect, 1.0);
        float dist = length(d);
        float front = dist - age * 0.45;
        float fade = 1.0 - age / 2.0;
        float wave = sin(front * 60.0) * exp(-front * front * 180.0) * fade * r.w;
        disp += (d / max(dist, 1e-4)) * wave * 0.009;
      }

      float causticGlint = exp(-pDist * pDist * 32.0) * 0.45;
      vec3 rainbow = 0.5 + 0.5 * cos(pDist * 16.0 - uTime * 2.5 + vec3(0.0, 2.0, 4.0));
      extraGlow = rainbow * causticGlint;

      vec2 dirP = dP / max(pDist, 1e-4);
      dirP.x /= uAspect;
      disp += dirP * exp(-pDist * pDist * 50.0) * 0.007 * (1.0 + uPointerSpeed * 2.2);
    } else if (uMode == 2) {
      // 03: Sonic Resonance (Harmonic standing waves & acoustic chime)
      vec2 centered = vUv - vec2(0.5);
      float angle = atan(centered.y, centered.x);
      float harmonic = sin(angle * 6.0 - uTime * 3.5) * cos(angle * 3.0 + uTime * 2.0);
      vec2 dir = centered / max(length(centered), 1e-4);
      disp += dir * harmonic * 0.0042;

      for (int i = 0; i < ${MAX_RIPPLES}; i++) {
        vec4 r = uRipples[i];
        float age = uTime - r.z;
        if (r.w <= 0.0 || age < 0.0 || age > 2.2) continue;
        float dR = length((vUv - r.xy) * vec2(uAspect, 1.0));
        float chime = sin((dR - age * 0.4) * 85.0) * exp(-age * 2.0) * r.w * 0.007;
        disp += dir * chime;
        extraGlow += vec3(0.65, 0.78, 1.0) * exp(-age * 3.5) * r.w * 0.28;
      }
    } else if (uMode == 3) {
      // 04: Gyroscopic Inertia (Weightless float & elliptical sheen)
      vec2 centered = (vUv - vec2(0.5)) * vec2(uAspect, 1.0);
      float r = length(centered);
      float breath = sin(r * 10.0 - uTime * 1.6) * 0.0022;
      disp += (centered / max(r, 1e-4)) * breath;

      float sheen = pow(1.0 - abs(r - 0.38) * 3.2, 3.0);
      extraGlow = vec3(0.72, 0.85, 1.0) * clamp(sheen, 0.0, 1.0) * 0.22;
    }

    vec2 uv = clamp(vUv + disp, vec2(0.001), vec2(0.999));
    vec4 base = texture2D(uTex, uv);
    
    // Chromatic dispersion inside glass
    float split = (uMode == 1) ? 1.4 : (uMode == 2 ? 1.1 : 0.8);
    float red = texture2D(uTex, clamp(uv + disp * split, vec2(0.001), vec2(0.999))).r;
    float blue = texture2D(uTex, clamp(uv - disp * split, vec2(0.001), vec2(0.999))).b;

    float cleanAlpha = smoothstep(0.02, 0.25, erodedAlpha(uv));
    float a = base.a * cleanAlpha;
    vec3 col = vec3(red, base.g, blue) + extraGlow * a;

    gl_FragColor = vec4(col, a);
  }
`

type Props = {
  px: MotionValue<number>
  py: MotionValue<number>
  mode: InteractionMode
  reducedMotion: boolean
}

export default function RibbonImage({ px, py, mode, reducedMotion }: Props) {
  const boxRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const hover = useMotionValue(0)
  const modeRef = useRef(mode)
  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  const ripples = useMemo<Ripples>(
    () => ({
      list: Array.from({ length: MAX_RIPPLES }, () => new THREE.Vector4(0, 0, -99, 0)),
      next: 0,
      clock: 0,
      pointer: new THREE.Vector2(0.5, 0.5),
      pointerSpeed: 0,
    }),
    [],
  )

  // Preload image reliably
  const imgRef = useRef<HTMLImageElement | null>(null)
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imgRef.current = img
      setImageLoaded(true)
    }
    img.src = ribbonUrl
    if (img.complete && img.naturalWidth > 0) {
      imgRef.current = img
      queueMicrotask(() => setImageLoaded(true))
    }
  }, [])

  // Direct Three.js Canvas initialization and animation loop (React 19 Safe)
  useEffect(() => {
    if (!imageLoaded || !imgRef.current || !containerRef.current) return
    const container = containerRef.current
    const img = imgRef.current

    let animId: number
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.domElement.className = 'ribbon-canvas'
    renderer.domElement.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;'
    container.innerHTML = ''
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
    camera.position.set(0, 0, 1)

    const texture = new THREE.Texture(img)
    texture.generateMipmaps = false
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.wrapS = THREE.ClampToEdgeWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    texture.needsUpdate = true

    const uniforms = {
      uTex: { value: texture },
      uTime: { value: 0 },
      uAspect: { value: img.width / img.height },
      uTexel: { value: new THREE.Vector2(1 / img.width, 1 / img.height) },
      uMode: { value: modeRef.current },
      uPointer: { value: ripples.pointer },
      uPointerSpeed: { value: 0 },
      uRipples: { value: ripples.list },
    }

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      uniforms,
    })

    const geometry = new THREE.PlaneGeometry(2, 2)
    const mesh = new THREE.Mesh(geometry, material)
    mesh.frustumCulled = false
    scene.add(mesh)

    const handleResize = () => {
      const rect = container.getBoundingClientRect()
      const w = Math.max(rect.width, 100)
      const h = Math.max(rect.height, 100)
      renderer.setSize(w, h, false)
      uniforms.uAspect.value = w / h
    }
    handleResize()
    window.addEventListener('resize', handleResize)

    const startTime = performance.now()
    const animate = () => {
      animId = requestAnimationFrame(animate)
      const elapsed = (performance.now() - startTime) * 0.001
      ripples.clock = elapsed
      uniforms.uTime.value = elapsed
      uniforms.uMode.value = modeRef.current
      uniforms.uPointer.value.copy(ripples.pointer)
      uniforms.uPointerSpeed.value = ripples.pointerSpeed

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
      geometry.dispose()
      material.dispose()
      texture.dispose()
      renderer.domElement.remove()
      renderer.dispose()
    }
  }, [imageLoaded, ripples])

  // Physics spring configurations per mode
  const springConfigs = [
    { stiffness: 60, damping: 20, mass: 0.9 },
    { stiffness: 95, damping: 26, mass: 0.8 },
    { stiffness: 70, damping: 22, mass: 1.0 },
    { stiffness: 28, damping: 14, mass: 2.2 }, // deep inertia
  ]
  const activeSpring = springConfigs[mode] || springConfigs[0]

  const sx = useSpring(px, activeSpring)
  const sy = useSpring(py, activeSpring)
  const k = useSpring(hover, { stiffness: 80, damping: 22 })

  const tiltMultiplier = mode === 3 ? 2.2 : 1.0
  const rotateY = useTransform(() => sx.get() * (2.5 + 5 * k.get()) * tiltMultiplier)
  const rotateX = useTransform(() => -sy.get() * (2 + 4 * k.get()) * tiltMultiplier)
  const x = useTransform(sx, (v) => v * (mode === 3 ? 28 : 16))
  const y = useTransform(sy, (v) => v * (mode === 3 ? 20 : 12))
  const scale = useTransform(k, (v) => 1 + v * (mode === 3 ? 0.025 : 0.015))

  useEffect(() => {
    if (reducedMotion) return
    let lastX = 0
    let lastY = 0
    let lastT = 0

    const locate = (e: PointerEvent) => {
      const el = boxRef.current
      if (!el) return null
      const r = el.getBoundingClientRect()
      const u = (e.clientX - r.left) / r.width
      const v = (e.clientY - r.top) / r.height
      const ex = (u - 0.5) / 0.45
      const ey = (v - 0.5) / 0.44
      const e2 = ex * ex + ey * ey
      return { u, v, onRibbon: e2 > 0.42 && e2 < 1.12 }
    }

    const spawn = (u: number, v: number, strength: number) => {
      ripples.list[ripples.next].set(u, 1 - v, ripples.clock, strength)
      ripples.next = (ripples.next + 1) % MAX_RIPPLES
    }

    const onMove = (e: PointerEvent) => {
      const hit = locate(e)
      if (!hit) return
      hover.set(hit.onRibbon ? 1 : 0)

      ripples.pointer.set(hit.u, 1 - hit.v)

      const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY)
      const now = performance.now()
      const dt = Math.max(1, now - lastT)
      const speed = dist / dt
      ripples.pointerSpeed = Math.min(2.5, speed * 0.8)

      if (hit.onRibbon && dist > 46 && dt > 90) {
        spawn(hit.u, hit.v, Math.min(1, 0.45 + dist / 220))
        lastX = e.clientX
        lastY = e.clientY
        lastT = now
      }
    }

    const onDown = (e: PointerEvent) => {
      const hit = locate(e)
      if (hit?.onRibbon) {
        spawn(hit.u, hit.v, mode === 2 ? 2.0 : 1.6)
      }
    }

    const onLeave = () => {
      hover.set(0)
      ripples.pointerSpeed = 0
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [reducedMotion, ripples, hover, mode])

  return (
    <div className="ribbon" aria-hidden="true">
      <motion.div
        ref={boxRef}
        className="ribbon-box"
        style={reducedMotion ? undefined : { rotateX, rotateY, x, y, scale }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reducedMotion ? 0 : 1.2, ease: EASE }}
      >
        {/* Crisp static fallback layer visible immediately while WebGL attaches */}
        <img
          src={ribbonUrl}
          alt=""
          className="ribbon-base-img"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            pointerEvents: 'none',
            opacity: imageLoaded ? 0 : 1,
            transition: 'opacity 0.4s ease',
          }}
        />

        {/* WebGL Canvas Container */}
        <div
          ref={containerRef}
          className="ribbon-canvas-container"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        />
      </motion.div>
    </div>
  )
}
