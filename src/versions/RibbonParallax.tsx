/* oxlint-disable */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ShaderMaterial, Texture, Vector2, Vector4 } from 'three'
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion'
import ribbonUrl from '../assets/backgorun-ribbon.png'

const MAX_RIPPLES = 10
const RIPPLE_LIFE = 2.2 // seconds
const EASE = [0.22, 1, 0.36, 1] as const

/** Ripple ring buffer shared by the pointer handlers and the shader: (u, v, startTime, strength). */
type Ripples = { list: Vector4[]; next: number; clock: number }

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

/**
 * Samples the ribbon artwork through expanding ring waves. Each ripple bends
 * the UVs radially and splits R/B a touch, which reads as light refracting
 * through liquid glass. A small alpha erosion removes the stray specks left
 * over from the background cut-out.
 */
const fragmentShader = /* glsl */ `
  uniform sampler2D uTex;
  uniform float uTime;
  uniform float uAspect;
  uniform vec2 uTexel;
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

    vec2 uv = vUv + disp;
    vec4 base = texture2D(uTex, uv);
    float red = texture2D(uTex, uv + disp * 0.8).r;
    float blue = texture2D(uTex, uv - disp * 0.8).b;

    float a = base.a * smoothstep(0.03, 0.3, erodedAlpha(uv));
    gl_FragColor = vec4(red, base.g, blue, a);
  }
`

function RibbonPlane({ image, ripples }: { image: HTMLImageElement; ripples: Ripples }) {
  const { viewport } = useThree()

  const material = useMemo(() => {
    const texture = new Texture(image)
    texture.needsUpdate = true
    return new ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTex: { value: texture },
        uTime: { value: 0 },
        uAspect: { value: image.width / image.height },
        uTexel: { value: new Vector2(1 / image.width, 1 / image.height) },
        uRipples: { value: ripples.list },
      },
    })
  }, [image, ripples])

  useFrame((state) => {
    ripples.clock = state.clock.elapsedTime
    material.uniforms.uTime.value = ripples.clock
  })

  return (
    <mesh material={material} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  )
}

function useImage(src: string) {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  useEffect(() => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => setImage(img)
    img.src = src
    if (img.complete && img.naturalWidth > 0) {
      setImage(img)
    }
  }, [src])
  return image
}

type Props = {
  /** Page-wide pointer, -1..1 on both axes (y down). */
  px: MotionValue<number>
  py: MotionValue<number>
  reducedMotion: boolean
}

export default function RibbonImage({ px, py, reducedMotion }: Props) {
  const boxRef = useRef<HTMLDivElement>(null)
  const image = useImage(ribbonUrl)
  const hover = useMotionValue(0)
  const ripples = useMemo<Ripples>(
    () => ({ list: Array.from({ length: MAX_RIPPLES }, () => new Vector4(0, 0, -99, 0)), next: 0, clock: 0 }),
    [],
  )

  // Gentle parallax everywhere; a stronger tilt toward the cursor while hovering the ribbon.
  const spring = { stiffness: 60, damping: 20, mass: 0.9 }
  const sx = useSpring(px, spring)
  const sy = useSpring(py, spring)
  const k = useSpring(hover, { stiffness: 80, damping: 22 })
  const rotateY = useTransform(() => sx.get() * (2.5 + 5 * k.get()))
  const rotateX = useTransform(() => -sy.get() * (2 + 4 * k.get()))
  const x = useTransform(sx, (v) => v * 16)
  const y = useTransform(sy, (v) => v * 12)
  const scale = useTransform(k, (v) => 1 + v * 0.015)

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
      // The ribbon is an elliptical band filling ~90% of the artwork.
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
      if (!hit.onRibbon) return
      const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY)
      const now = performance.now()
      if (dist > 46 && now - lastT > 90) {
        spawn(hit.u, hit.v, Math.min(1, 0.45 + dist / 220))
        lastX = e.clientX
        lastY = e.clientY
        lastT = now
      }
    }

    const onDown = (e: PointerEvent) => {
      const hit = locate(e)
      if (hit?.onRibbon) spawn(hit.u, hit.v, 1.6)
    }

    const onLeave = () => hover.set(0)

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [reducedMotion, ripples, hover])

  return (
    <div className="ribbon" aria-hidden="true">
      <motion.div
        ref={boxRef}
        className="ribbon-box"
        style={reducedMotion ? undefined : { rotateX, rotateY, x, y, scale }}
        initial={{ opacity: 0 }}
        animate={{ opacity: image ? 1 : 0 }}
        transition={{ duration: reducedMotion ? 0 : 1.8, ease: EASE, delay: 0.1 }}
      >
        {image && (
          <Canvas
            flat
            orthographic
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true }}
            camera={{ position: [0, 0, 5], zoom: 1 }}
          >
            <RibbonPlane image={image} ripples={ripples} />
          </Canvas>
        )}
      </motion.div>
    </div>
  )
}
