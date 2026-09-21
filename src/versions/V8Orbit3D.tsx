import HeroLayout from '../hero/HeroLayout'
import OrbitScene from '../three/OrbitScene'
import type { VersionProps } from './types'

/** v8 — Real-time 3D optical glass ribbon with continuous rigid elliptical orbit */
export default function V8Orbit3D({ reducedMotion }: VersionProps) {
  return (
    <HeroLayout>
      <div className="ribbon" aria-hidden="true" style={{ pointerEvents: 'none' }}>
        <div
          className="ribbon-box"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <OrbitScene quality="high" reducedMotion={reducedMotion} />
        </div>
      </div>
    </HeroLayout>
  )
}
