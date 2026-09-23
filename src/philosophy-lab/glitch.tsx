import { useRef } from 'react'

import { LIQUID_MINIMAL, LIQUID_PAD, useLiquidText, type LiquidConfig } from '../components/liquidText'
import { TEXT, type Variant } from './variants'

/**
 * The variant gallery for the hover-liquid manifesto. The effect itself lives
 * in src/components/liquidText.ts, shared with the live Design Philosophy
 * section; this file only supplies the configurations to compare.
 */

const WORDS = TEXT.split(' ')

type Config = LiquidConfig

function GlitchText({ config }: { config: Partial<Config> }) {
  const sectionRef = useRef<HTMLElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLHeadingElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useLiquidText({ sectionRef, wrapRef, textRef, canvasRef, containerRef }, config)

  return (
    <section ref={sectionRef} className="content-section philosophy-section plab-section glitch-section">
      <div className="section-container philosophy-manifesto-container plab-inner" ref={containerRef}>
        <div className="manifesto-top-bar">
          <span className="manifesto-eyebrow">Design Philosophy</span>
        </div>
        <div className="glitch-wrap" ref={wrapRef}>
          <h2 className="manifesto-text left-aligned glitch-dom" ref={textRef}>
            {WORDS.map((w, i) => (
              <span key={i} className="manifesto-scroll-word-wrapper" data-w>
                {w}
              </span>
            ))}
          </h2>
          <canvas
            ref={canvasRef}
            className="glitch-canvas"
            style={{ left: -LIQUID_PAD, top: -LIQUID_PAD }}
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  )
}

const make = (config: Partial<Config>) => () => <GlitchText config={config} />

export const GLITCH_VARIANTS: Variant[] = [
  {
    id: 'minimal',
    name: 'Minimal liquid',
    group: 'Liquid',
    note: 'Reveals on scroll exactly like the live section, then a pure fish-eye on hover: the text swells under the cursor and eases back. No colour split.',
    Component: make(LIQUID_MINIMAL),
  },
  {
    id: 'lens',
    name: 'Liquid lens',
    group: 'Liquid',
    note: 'Hover the text: it bulges under the cursor like the hero fluid, with colour fringes where it bends. Leave and it springs back.',
    Component: make({}),
  },
  {
    id: 'wake',
    name: 'Liquid wake',
    group: 'Liquid',
    note: 'A lighter bulge but a long wake: sweep across the words and they smear along your path, trailing colour, then flow back.',
    Component: make({ push: 0.35, pushRadius: 110, wake: 2.2, wakeRadius: 110, wakeRelax: 1.1, split: 0.4 }),
  },
  {
    id: 'brand',
    name: 'Brand fringe',
    group: 'On-brand',
    note: 'The liquid lens, but the fringes are the hero’s indigo and peach instead of raw RGB.',
    Component: make({ palette: 'brand', split: 0.4 }),
  },
  {
    id: 'shear',
    name: 'Scroll shear',
    group: 'Motion',
    note: 'Scrolling fast ripples the text into a wave with a sideways split; it settles as you slow down. Hover still bends it.',
    Component: make({ shear: 1, push: 0.5 }),
  },
  {
    id: 'signal',
    name: 'Signal glitch',
    group: 'Bold',
    note: 'The bulge plus digital slice offsets and a hard channel split near the cursor. The most “glitch”, closest to the reference.',
    Component: make({ slices: 1, splitFloor: 5, split: 0.45, springZ: 0.3 }),
  },
]
