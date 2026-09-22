import { useEffect, useState } from 'react'
import { ArrowLeft, RotateCcw } from 'lucide-react'

import { VARIANTS, type Variant } from './variants'
import './philosophy-lab.css'

/* The chosen variant lives in ?v= so a link opens straight to it. */
const readVariant = (list: Variant[]) => {
  const v = new URLSearchParams(window.location.search).get('v')
  return list.some((x) => x.id === v) ? v! : list[0].id
}

/**
 * Side-by-side lab for the Design Philosophy scroll animation. Pick a variant
 * in the bar, then scroll: each one plays on the same manifesto copy as the
 * live section. Nothing here touches src/components/DesignPhilosophy.tsx.
 */
export default function PhilosophyLab({
  onBack,
  variants: VARIANTS_IN = VARIANTS,
  title = 'Design Philosophy · scroll animation',
  hint = 'Scroll to play ↓',
}: {
  onBack?: () => void
  variants?: Variant[]
  title?: string
  hint?: string
}) {
  const VARIANTS = VARIANTS_IN
  const [id, setId] = useState(() => readVariant(VARIANTS))
  const index = VARIANTS.findIndex((v) => v.id === id)
  const variant = VARIANTS[index]
  const { Component } = variant

  const select = (next: string) => {
    setId(next)
    const url = new URL(window.location.href)
    url.searchParams.set('v', next)
    window.history.replaceState({}, '', url)
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }

  /* Arrow keys step through variants, for presenting. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
      const step = e.key === 'ArrowRight' ? 1 : -1
      select(VARIANTS[(index + step + VARIANTS.length) % VARIANTS.length].id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="plab">
      <header className="plab-bar">
        <div className="plab-bar__row">
          {onBack && (
            <button type="button" className="plab-bar__back" onClick={onBack}>
              <ArrowLeft size={14} /> Back
            </button>
          )}
          <span className="plab-bar__title">{title}</span>
          <button
            type="button"
            className="plab-bar__replay"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <RotateCcw size={13} /> Replay
          </button>
        </div>
        <nav className="plab-bar__tabs" aria-label="Variants">
          {VARIANTS.map((v, i) => (
            <button
              key={v.id}
              type="button"
              className={`plab-tab ${v.id === id ? 'is-active' : ''}`}
              onClick={() => select(v.id)}
              aria-pressed={v.id === id}
            >
              <span className="plab-tab__num">{String(i).padStart(2, '0')}</span>
              {v.name}
              <span className={`plab-tab__group plab-tab__group--${v.group.toLowerCase().replace(/\W/g, '')}`}>
                {v.group}
              </span>
            </button>
          ))}
        </nav>
      </header>

      {/* Lead-in: room to scroll so the reveal plays from the start. */}
      <section className="plab-intro">
        <span className="plab-intro__num">
          {String(index).padStart(2, '0')} / {String(VARIANTS.length - 1).padStart(2, '0')}
        </span>
        <h1 className="plab-intro__name">{variant.name}</h1>
        <p className="plab-intro__note">{variant.note}</p>
        <span className="plab-intro__hint">{hint}</span>
      </section>

      {/* Keyed so switching restarts the variant from a clean state. */}
      <Component key={id} />

      <section className="plab-outro">
        <button
          type="button"
          className="plab-next"
          onClick={() => select(VARIANTS[(index + 1) % VARIANTS.length].id)}
        >
          Next: {VARIANTS[(index + 1) % VARIANTS.length].name} →
        </button>
      </section>
    </div>
  )
}
