import { useId } from 'react'

import { GLYPH } from './glyphShape'


/* Gap lines: bottom x in the viewBox, drawn along the right edge's slope
   (dx -110 per dy 460). */
const GAPS = [225, 280, 335, 390, 445]
const gapTop = (x: number) => x + (110 * 540) / 460

type Props = {
  className?: string
  /** Blur on the body; higher reads softer and more diffuse. */
  softness?: number
  /** Blur on the yellow-green fringe. */
  haloBlur?: number
}

/**
 * The blurred, striped RazorSense glyph. Used by the Design Language panel and
 * the Watch Video poster. Filter ids are per instance so several can share a
 * page.
 */
export default function GlyphArt({ className, softness = 7, haloBlur = 18 }: Props) {
  const uid = useId().replace(/:/g, '')
  const halo = `glyph-halo-${uid}`
  const soft = `glyph-soft-${uid}`
  const fill = `glyph-fill-${uid}`
  const gaps = `glyph-gaps-${uid}`

  return (
    <svg className={className} viewBox="0 0 815 754" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs>
        <filter id={halo} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={haloBlur} />
        </filter>
        <filter id={soft} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={softness} />
        </filter>
        <linearGradient id={fill} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#3a63ea" />
          <stop offset="55%" stopColor="#2a52dc" />
          <stop offset="100%" stopColor="#3560e6" />
        </linearGradient>
        <mask id={gaps} maskUnits="userSpaceOnUse" x="0" y="0" width="815" height="754">
          <path d={GLYPH} fill="#fff" />
          {GAPS.map((x) => (
            <line key={x} x1={x} y1={640} x2={gapTop(x)} y2={100} stroke="#000" strokeWidth={5} />
          ))}
        </mask>
      </defs>

      {/* Yellow-green fringe around the edge */}
      <path
        d={GLYPH}
        fill="#eef6c2"
        stroke="#eef6c2"
        strokeWidth={30}
        strokeLinejoin="round"
        filter={`url(#${halo})`}
      />
      {/* Soft white bloom at the top-right peak */}
      <ellipse cx="560" cy="150" rx="70" ry="50" fill="#ffffff" opacity="0.7" filter={`url(#${halo})`} />

      {/* The blue body, sliced by the gaps, then softened as a whole so the
          gaps read as light seams rather than cut lines. */}
      <g filter={`url(#${soft})`}>
        <path d={GLYPH} fill={`url(#${fill})`} mask={`url(#${gaps})`} />
      </g>
    </svg>
  )
}
