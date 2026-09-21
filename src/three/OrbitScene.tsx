import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { BackSide, FrontSide, Group, ShaderMaterial, type Side } from 'three'
import { createRibbonGeometry } from './ribbonGeometry'

type Quality = 'high' | 'low'

type Props = {
  quality: Quality
  reducedMotion: boolean
}

const SPIN_PERIOD = 16 // seconds per full turn — linear, perfectly periodic
const START_ANGLE = 2.2 // resting orientation (also the reduced-motion pose)
const TAU = Math.PI * 2

const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorld;
  varying float vDepth;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec4 mv = viewMatrix * world;
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`

/**
 * Optical glass. The body is almost clear; what you see is reflected light —
 * a procedural soft studio (overhead softbox, key strip on the right, a
 * periwinkle horizon for edge definition, peach/pink/cool bounce light),
 * tinted by a gentle thin-film shift and weighted by Schlick Fresnel.
 */
const fragmentShader = /* glsl */ `
  uniform float uOpacity;
  uniform float uCenter;
  uniform float uSpan;
  varying vec3 vNormal;
  varying vec3 vWorld;
  varying float vDepth;

  vec3 film(float t) {
    vec3 c0 = vec3(0.70, 0.78, 1.00); // pale blue
    vec3 c1 = vec3(0.82, 0.78, 1.00); // lavender
    vec3 c2 = vec3(1.00, 0.82, 0.93); // pink
    vec3 c3 = vec3(1.00, 0.90, 0.82); // peach
    t = fract(t) * 4.0;
    if (t < 1.0) return mix(c0, c1, t);
    if (t < 2.0) return mix(c1, c2, t - 1.0);
    if (t < 3.0) return mix(c2, c3, t - 2.0);
    return mix(c3, c0, t - 3.0);
  }

  float lobe(vec3 r, vec3 d, float p) {
    return pow(max(dot(r, normalize(d)), 0.0), p);
  }

  vec3 studio(vec3 r) {
    float up = r.y;
    vec3 c = mix(vec3(0.60, 0.66, 0.94), vec3(0.88, 0.90, 1.0), smoothstep(-0.6, 0.5, up));
    c = mix(c, vec3(0.42, 0.49, 0.88), exp(-pow((up + 0.05) * 6.0, 2.0)) * 0.55);
    c += vec3(1.0) * smoothstep(0.6, 0.95, up) * 0.5;
    c += vec3(1.0) * lobe(r, vec3(0.85, 0.35, 0.4), 16.0) * 1.6;
    c += vec3(1.0, 0.78, 0.66) * lobe(r, vec3(-0.6, -0.5, 0.6), 6.0) * 0.8;
    c += vec3(1.0, 0.72, 0.90) * lobe(r, vec3(0.3, -0.8, 0.5), 6.0) * 0.5;
    c += vec3(0.60, 0.75, 1.0) * lobe(r, vec3(-0.9, 0.3, -0.1), 5.0) * 0.6;
    return c;
  }

  void main() {
    vec3 N = normalize(vNormal);
    if (!gl_FrontFacing) N = -N;
    vec3 V = normalize(cameraPosition - vWorld);
    float ndv = clamp(dot(N, V), 0.0, 1.0);
    float F = 0.06 + 0.94 * pow(1.0 - ndv, 3.0);

    vec3 R = reflect(-V, N);
    vec3 tint = film(ndv * 0.9 + vWorld.x * 0.06 - vWorld.y * 0.08);
    vec3 col = studio(R) * mix(vec3(1.0), tint, 0.65);

    float lum = dot(col, vec3(0.333));
    float glint = smoothstep(1.15, 1.9, lum);

    // The far side of the loop reads thinner and more transparent.
    float far = clamp((vDepth - uCenter) / uSpan * 0.5 + 0.5, 0.0, 1.0);
    float alpha = (0.03 + F * 0.9 + glint * 0.6) * mix(1.0, 0.6, far);

    gl_FragColor = vec4(min(col, vec3(1.0)), clamp(alpha, 0.0, 1.0) * uOpacity);
  }
`

function useGlass(side: Side, opacity: number) {
  return useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        side,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uOpacity: { value: opacity },
          uCenter: { value: 10 },
          uSpan: { value: 3 },
        },
      }),
    [side, opacity],
  )
}

function Ribbon({ quality, reducedMotion }: Props) {
  const geometry = useMemo(
    () => (quality === 'high' ? createRibbonGeometry(600, 48) : createRibbonGeometry(320, 28)),
    [quality],
  )
  const back = useGlass(BackSide, 0.7)
  const front = useGlass(FrontSide, 1)
  const spin = useRef<Group>(null!)

  const { viewport, camera, size } = useThree()
  const portrait = size.width < size.height * 0.8
  const vp = viewport.getCurrentViewport(camera, [0, 0, 0])

  // ~80% of the viewport wide and ~65% tall on desktop; bleeds a little on phones.
  const fit = portrait ? vp.width * 0.5 : Math.min(vp.width * 0.4, vp.height * 0.6)
  const tilt = portrait ? -0.88 : -1.08 // ≈ 62° around X on desktop

  // One rigid mesh turning about its own centre. The angle comes straight from
  // the clock (not accumulated), so speed is constant and every period ends at
  // exactly the starting orientation. Only the object moves: camera, lights,
  // background and UI stay fixed, so reflections shift naturally as it turns.
  useFrame((state) => {
    const t = state.clock.elapsedTime
    for (const m of [back, front]) {
      m.uniforms.uCenter.value = state.camera.position.z
      m.uniforms.uSpan.value = fit
    }
    const turn = reducedMotion ? 0 : ((t % SPIN_PERIOD) / SPIN_PERIOD) * TAU
    spin.current.rotation.z = START_ANGLE + turn
  })

  return (
    <group position={[0, portrait ? 0 : vp.height * 0.045, 0]} scale={fit}>
      {/* screen-space lean: right side higher, like the reference */}
      <group rotation={[0, -0.06, 0.2]}>
        <group rotation={[tilt, 0, 0]}>
          <group ref={spin} rotation={[0, 0, START_ANGLE]}>
            <mesh geometry={geometry} material={back} renderOrder={1} />
            <mesh geometry={geometry} material={front} renderOrder={2} />
          </group>
        </group>
      </group>
    </group>
  )
}

export default function OrbitScene({ quality, reducedMotion }: Props) {
  return (
    <Canvas
      flat
      dpr={quality === 'high' ? [1, 2] : [1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 10], fov: 32, near: 0.1, far: 100 }}
    >
      <Ribbon quality={quality} reducedMotion={reducedMotion} />
    </Canvas>
  )
}
