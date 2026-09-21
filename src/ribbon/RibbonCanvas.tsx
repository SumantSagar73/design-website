/* oxlint-disable */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { MathUtils, ShaderMaterial, Texture, Vector2, Vector3, Vector4 } from 'three'
import { motion } from 'framer-motion'
import ribbonUrl from '../assets/backgorun-ribbon.png'

/**
 * Shared renderer for the ribbon artwork. Every hero version composes it with
 * a different mix of effects; the artwork itself never moves unless a version
 * wraps it in its own motion.
 *
 * - ripple: ring waves on hover / click
 * - sheen:  a soft pastel highlight that follows the cursor (drifts when idle)
 * - lens:   a small magnifying glass bulge under the cursor
 * - gyro:   a slow breath travelling out along the orbit, with a cool band of
 *           light pooled on its centre line — motion without a moving artwork
 * - layer:  'all' | 'back' | 'front' — split along the orbit's centre line so
 *           the front arc can sit above the headline and the back arc behind it
 */
export type RibbonEffects = {
  ripple?: boolean
  sheen?: boolean
  lens?: boolean
  gyro?: boolean
  layer?: 'all' | 'back' | 'front'
}

const MAX_RIPPLES = 10
const RIPPLE_LIFE = 2.2
const EASE = [0.22, 1, 0.36, 1] as const

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
  uniform vec4 uRipples[${MAX_RIPPLES}];
  uniform vec3 uSheen;   // xy = light position (uv), z = intensity
  uniform vec3 uLens;    // xy = lens centre (uv), z = strength
  uniform float uGyro;     // gyroscopic breath, 0 or 1
  uniform float uGyroTime; // its clock; held at 0 under reduced motion
  uniform float uLayer;  // 0 all, 1 back, 2 front
  varying vec2 vUv;

  vec3 film(float t) {
    vec3 c0 = vec3(0.72, 0.80, 1.00);
    vec3 c1 = vec3(0.84, 0.80, 1.00);
    vec3 c2 = vec3(1.00, 0.84, 0.94);
    vec3 c3 = vec3(1.00, 0.91, 0.84);
    t = fract(t) * 4.0;
    if (t < 1.0) return mix(c0, c1, t);
    if (t < 2.0) return mix(c1, c2, t - 1.0);
    if (t < 3.0) return mix(c2, c3, t - 2.0);
    return mix(c3, c0, t - 3.0);
  }

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
    vec2 uv = vUv;

    // Liquid lens: magnify inside a small disc, strongest at its centre.
    float lensK = 0.0;
    float lensRim = 0.0;
    if (uLens.z > 0.001) {
      vec2 d = uv - uLens.xy;
      d.x *= uAspect;
      float R = 0.11;
      float r = length(d);
      lensRim = smoothstep(R - 0.008, R - 0.002, r) * (1.0 - smoothstep(R - 0.002, R + 0.002, r)) * uLens.z;
      if (r < R) {
        float k = 1.0 - (r / R) * (r / R);
        lensK = k * uLens.z;
        d *= 1.0 - 0.45 * lensK;
        d.x /= uAspect;
        uv = uLens.xy + d;
      }
    }

    // Ripples: radial ring waves.
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

    // Gyroscopic breath. Everything is measured against the orbit's own ellipse
    // — the same one the pointer hit-test uses — so the pulses travel along the
    // band instead of radiating out of an arbitrary circle. The artwork never
    // moves; this is where the life comes from.
    float ex = (vUv.x - 0.5) / 0.45;
    float ey = ((0.5 - vUv.y) + (vUv.x - 0.5) * 0.27) / 0.40;
    float orbit = sqrt(ex * ex + ey * ey);   // ~0.94 on the band's centre line
    float pulse = sin(orbit * 9.0 - uGyroTime * 1.5);
    float band = pow(max(1.0 - abs(orbit - 0.94) * 3.2, 0.0), 3.0);

    if (uGyro > 0.001) {
      // Push across the band (the ellipse's gradient), not radially from centre.
      vec2 grad = vec2(ex / 0.45 + ey * 0.675, -ey / 0.40);
      disp += (grad / max(length(grad), 1e-4)) * pulse * 0.003 * uGyro;
    }

    uv += disp;

    // Chromatic split from both distortions reads as refraction.
    vec2 chroma = disp * 0.8 + (uv - uLens.xy) * lensK * 0.06;
    vec4 base = texture2D(uTex, uv);
    vec3 col = vec3(texture2D(uTex, uv + chroma).r, base.g, texture2D(uTex, uv - chroma).b);
    float a = base.a * smoothstep(0.03, 0.3, erodedAlpha(uv));

    // The lens edge catches light, but only where it passes over glass.
    col = mix(col, vec3(1.0), lensRim * 0.7 * step(0.05, a));

    // The breath read as light: a cool band pooled along the orbit, swelling
    // slowly, with the outgoing crests catching a brighter glint. Masked by
    // alpha so it only ever lands on glass.
    if (uGyro > 0.001) {
      float swell = 0.86 + 0.14 * sin(uGyroTime * 0.8);
      col += vec3(0.72, 0.85, 1.00) * band * 0.19 * swell * a * uGyro;
      col += vec3(0.82, 0.90, 1.00) * max(pulse, 0.0) * band * 0.08 * a * uGyro;
      // Keep it under 1 so the sheen below still reads as light on glass
      // rather than compounding into a blown-out white arc.
      col = min(col, vec3(1.0));
    }

    // Sheen: light catching the glass — only lifts pixels that are already bright.
    if (uSheen.z > 0.001) {
      vec2 d = vUv - uSheen.xy;
      d.x *= uAspect;
      float r2 = dot(d, d);
      float broad = exp(-r2 * 22.0);
      float core = exp(-r2 * 160.0);
      float lum = dot(col, vec3(0.333));
      vec3 tint = film(sqrt(r2) * 2.2 + uTime * 0.04);
      float lift = (broad * 0.45 + core * 0.7) * smoothstep(0.3, 0.95, lum) * uSheen.z;
      col = mix(col, min(col + tint * 0.6, vec3(1.0)), lift);
      a = min(1.0, a * (1.0 + (broad * 0.25 + core * 0.35) * uSheen.z));
    }

    // Front/back split along the tilted centre line of the orbit.
    if (uLayer > 0.5) {
      float top = 1.0 - vUv.y;
      float split = 0.5 - (vUv.x - 0.5) * 0.27;
      float front = smoothstep(-0.012, 0.012, top - split);
      a *= uLayer < 1.5 ? 1.0 - front : front;
    }

    gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
  }
`

/** Point on the orbit's centre-line ellipse, in uv (y up). Used for idle sheen drift. */
function orbitUv(t: number, out: Vector2) {
  const u = 0.5 + 0.44 * Math.cos(t)
  const top = 0.5 + 0.36 * Math.sin(t) - (u - 0.5) * 0.27
  return out.set(u, 1 - top)
}

type PointerState = { u: number; v: number; inside: boolean; onRibbon: boolean; lastMove: number }

function RibbonPlane({
  image,
  effects,
  pointer,
  ripples,
  reducedMotion,
}: {
  image: HTMLImageElement
  effects: RibbonEffects
  pointer: PointerState
  ripples: { list: Vector4[]; clock: number }
  reducedMotion: boolean
}) {
  const { viewport } = useThree()
  const light = useRef(new Vector2(0.2, 0.3))
  const lens = useRef(new Vector3(0.5, 0.5, 0))
  const idle = useRef(new Vector2())

  const material = useMemo(() => {
    const texture = new Texture(image)
    texture.needsUpdate = true
    const layer = effects.layer === 'back' ? 1 : effects.layer === 'front' ? 2 : 0
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
        uSheen: { value: new Vector3(0, 0, 0) },
        uLens: { value: new Vector3(0.5, 0.5, 0) },
        uGyro: { value: 0 },
        uGyroTime: { value: 0 },
        uLayer: { value: layer },
      },
    })
  }, [image, ripples, effects.layer])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    const dt = Math.min(delta, 1 / 30)
    ripples.clock = t
    material.uniforms.uTime.value = t
    material.uniforms.uGyro.value = effects.gyro ? 1 : 0
    material.uniforms.uGyroTime.value = reducedMotion ? 0 : t

    if (effects.sheen) {
      // Follow the cursor over the artwork; drift slowly along the orbit when idle.
      const active = !reducedMotion && pointer.inside && performance.now() - pointer.lastMove < 2500
      const target = active
        ? idle.current.set(pointer.u, 1 - pointer.v)
        : orbitUv(reducedMotion ? 3.6 : t * 0.55 + 3.6, idle.current)
      const speed = active ? 5 : 1.4
      light.current.x = MathUtils.damp(light.current.x, target.x, speed, dt)
      light.current.y = MathUtils.damp(light.current.y, target.y, speed, dt)
      material.uniforms.uSheen.value.set(light.current.x, light.current.y, 1)
    }

    if (effects.lens) {
      const on = !reducedMotion && pointer.onRibbon ? 1 : 0
      lens.current.x = MathUtils.damp(lens.current.x, pointer.u, 9, dt)
      lens.current.y = MathUtils.damp(lens.current.y, 1 - pointer.v, 9, dt)
      lens.current.z = MathUtils.damp(lens.current.z, on, 5, dt)
      material.uniforms.uLens.value.copy(lens.current)
    }
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
  effects?: RibbonEffects
  reducedMotion: boolean
  /** Extra class on the positioning layer (e.g. float animation, front z-index). */
  className?: string
  /** Rendered inside the positioning layer, behind the artwork (e.g. a glow). */
  underlay?: ReactNode
}

export default function RibbonCanvas({ effects = {}, reducedMotion, className, underlay }: Props) {
  const boxRef = useRef<HTMLDivElement>(null)
  const image = useImage(ribbonUrl)
  const pointer = useMemo<PointerState>(() => ({ u: 0.5, v: 0.5, inside: false, onRibbon: false, lastMove: 0 }), [])
  const ripples = useMemo(
    () => ({ list: Array.from({ length: MAX_RIPPLES }, () => new Vector4(0, 0, -99, 0)), next: 0, clock: 0 }),
    [],
  )
  const interactive = !reducedMotion && (effects.ripple || effects.sheen || effects.lens)

  useEffect(() => {
    if (!interactive) return
    let lastX = 0
    let lastY = 0
    let lastT = 0

    const locate = (e: PointerEvent) => {
      const r = boxRef.current?.getBoundingClientRect()
      if (!r) return false
      pointer.u = (e.clientX - r.left) / r.width
      pointer.v = (e.clientY - r.top) / r.height
      // the orbit band, following its tilt
      const ex = (pointer.u - 0.5) / 0.45
      const ey = (pointer.v - 0.5 + (pointer.u - 0.5) * 0.27) / 0.4
      const e2 = ex * ex + ey * ey
      pointer.inside = pointer.u >= 0 && pointer.u <= 1 && pointer.v >= 0 && pointer.v <= 1
      pointer.onRibbon = e2 > 0.5 && e2 < 1.2
      return true
    }

    const spawn = (strength: number) => {
      ripples.list[ripples.next].set(pointer.u, 1 - pointer.v, ripples.clock, strength)
      ripples.next = (ripples.next + 1) % MAX_RIPPLES
    }

    const onMove = (e: PointerEvent) => {
      if (!locate(e)) return
      pointer.lastMove = performance.now()
      if (!effects.ripple || !pointer.onRibbon) return
      const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY)
      if (dist > 46 && pointer.lastMove - lastT > 90) {
        spawn(Math.min(1, 0.45 + dist / 220))
        lastX = e.clientX
        lastY = e.clientY
        lastT = pointer.lastMove
      }
    }
    const onDown = (e: PointerEvent) => {
      if (locate(e) && effects.ripple && pointer.onRibbon) spawn(1.6)
    }
    const onLeave = () => {
      pointer.inside = false
      pointer.onRibbon = false
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [interactive, effects.ripple, pointer, ripples])

  return (
    <div className={`ribbon ${className ?? ''}`} aria-hidden="true">
      {underlay}
      <motion.div
        ref={boxRef}
        className="ribbon-box"
        initial={{ opacity: 0 }}
        animate={{ opacity: image ? 1 : 0 }}
        transition={{ duration: reducedMotion ? 0 : 1.8, ease: EASE, delay: 0.1 }}
      >
        {image && (
          <Canvas flat orthographic dpr={[1, 2]} gl={{ antialias: true, alpha: true }} camera={{ position: [0, 0, 5], zoom: 1 }}>
            <RibbonPlane image={image} effects={effects} pointer={pointer} ripples={ripples} reducedMotion={reducedMotion} />
          </Canvas>
        )}
      </motion.div>
    </div>
  )
}
