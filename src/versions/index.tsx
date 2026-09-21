import type { ComponentType } from 'react'
import V0 from './V0'
import type { VersionProps } from './types'

export type Version = {
  id: string
  name: string
  note: string
  Component: ComponentType<VersionProps>
}

/**
 * v0 is the main design.
 * 
 * Note: Remaining version files (V1Interactive, V1Parallax, V2Sheen, V3Wrap,
 * V4Lens, V5Calm, V6SheenWrap, V7WrapCalm, V8Orbit3D, RibbonParallax, etc.)
 * are preserved as standalone files in this directory and not connected to anything.
 */
export const versions: Version[] = [
  {
    id: '0',
    name: 'Gyroscopic Glass',
    note: 'Main Design — a still orbit breathing under its own weight; light follows the cursor',
    Component: V0,
  },
]

export { V0 }
export default V0
