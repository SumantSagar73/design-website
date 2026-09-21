import { useEffect } from 'react'
import { useMotionValue, useSpring, useTransform } from 'framer-motion'
import HeroLayout from '../hero/HeroLayout'
import RibbonParallax from './RibbonParallax'
import type { VersionProps } from './types'

/** v1 — the artwork drifts and tilts toward the cursor; ripples on hover. */
export default function V1Parallax({ reducedMotion }: VersionProps) {
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  useEffect(() => {
    if (reducedMotion) return
    const onMove = (e: PointerEvent) => {
      px.set((e.clientX / window.innerWidth) * 2 - 1)
      py.set((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [reducedMotion, px, py])
  const x = useTransform(useSpring(px, { stiffness: 40, damping: 18 }), (v) => v * -2)
  const y = useTransform(useSpring(py, { stiffness: 40, damping: 18 }), (v) => v * -2)

  return (
    <HeroLayout textStyle={reducedMotion ? undefined : { x, y }}>
      <RibbonParallax px={px} py={py} reducedMotion={reducedMotion} />
    </HeroLayout>
  )
}
