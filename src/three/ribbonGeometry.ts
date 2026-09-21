import { BufferAttribute, BufferGeometry, Vector3 } from 'three'

const TAU = Math.PI * 2

/**
 * The orbital path: a near-circular, slightly irregular loop in the XY plane (the tilt
 * turns it into an ellipse, so spinning it never swings the long axis) with a
 * gentle out-of-plane wave, so the loop never reads as a perfect CSS ellipse.
 */
function orbitPoint(t: number, out: Vector3) {
  const x = Math.cos(t) * (1 + 0.028 * Math.sin(2 * t + 0.4))
  const y = 0.95 * Math.sin(t) * (1 + 0.03 * Math.cos(3 * t + 0.2))
  const z = 0.06 * Math.sin(2 * t + 0.9)
  return out.set(x, y, z)
}

/** Half-width of the band — broad on the lower-left, slim across the back. */
const halfWidth = (t: number) =>
  0.078 + 0.04 * Math.sin(t + 2.3) + 0.008 * Math.sin(2 * t + 0.3)

/** Half-thickness — flat like a sheet of acrylic, with a soft round bevel. */
const halfThickness = (t: number) => 0.019 + 0.004 * Math.sin(t + 1.1)

/**
 * The band makes exactly one half turn per loop (a Möbius strip). Because the
 * cross-section is symmetric under a 180° rotation, the surface closes on
 * itself with no seam: one continuous ribbon with no beginning and no end.
 */
const twist = (t: number) => t / 2 + 0.38 * Math.sin(t + 0.5) + 0.2

export function createRibbonGeometry(segments = 512, radial = 40) {
  if (radial % 2) radial += 1

  const count = segments * radial
  const positions = new Float32Array(count * 3)
  const normals = new Float32Array(count * 3)
  const uvs = new Float32Array(count * 2)

  const c = new Vector3()
  const a = new Vector3()
  const b = new Vector3()
  const T = new Vector3()
  const R = new Vector3()
  const U = new Vector3()
  const W = new Vector3()
  const N = new Vector3()
  const p = new Vector3()
  const n = new Vector3()
  const Z = new Vector3(0, 0, 1)
  const e = 1e-4

  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * TAU
    orbitPoint(t, c)
    orbitPoint(t + e, a)
    orbitPoint(t - e, b)
    T.subVectors(a, b).normalize()
    R.crossVectors(T, Z).normalize() // outward, in the orbit plane
    U.crossVectors(R, T).normalize() // ~ plane normal, orthogonal to T

    const phi = twist(t)
    W.copy(U).multiplyScalar(Math.cos(phi)).addScaledVector(R, Math.sin(phi))
    N.crossVectors(T, W).normalize()

    const w = halfWidth(t)
    const h = halfThickness(t)

    for (let j = 0; j < radial; j++) {
      const s = (j / radial) * TAU
      const cs = Math.cos(s)
      const sn = Math.sin(s)
      p.copy(c).addScaledVector(W, w * cs).addScaledVector(N, h * sn)
      n.copy(W).multiplyScalar(cs / w).addScaledVector(N, sn / h).normalize()

      const k = i * radial + j
      positions.set([p.x, p.y, p.z], k * 3)
      normals.set([n.x, n.y, n.z], k * 3)
      uvs.set([i / segments, j / radial], k * 2)
    }
  }

  const indices = new Uint32Array(segments * radial * 6)
  let q = 0
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments
    // Closing ring: after a half twist, vertex j lines up with j + radial/2.
    const shift = i === segments - 1 ? radial / 2 : 0
    for (let j = 0; j < radial; j++) {
      const i0 = i * radial + j
      const i1 = next * radial + ((j + shift) % radial)
      const i2 = next * radial + ((j + 1 + shift) % radial)
      const i3 = i * radial + ((j + 1) % radial)
      indices[q++] = i0
      indices[q++] = i3
      indices[q++] = i1
      indices[q++] = i1
      indices[q++] = i3
      indices[q++] = i2
    }
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new BufferAttribute(normals, 3))
  geometry.setAttribute('uv', new BufferAttribute(uvs, 2))
  geometry.setIndex(new BufferAttribute(indices, 1))
  geometry.computeBoundingSphere()
  return geometry
}
