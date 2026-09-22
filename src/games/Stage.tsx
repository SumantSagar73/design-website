import type { ReactNode, Ref } from 'react'

export type Overlay = {
  title: string
  body?: string
  action: string
  onAction: () => void
}

type Props = {
  /** Game canvas and/or DOM pieces. */
  children: ReactNode
  score?: number | string
  best?: number | string
  /** Extra HUD chips, e.g. lives or level. */
  extra?: { label: string; value: ReactNode }[]
  /** Short control hint shown top-right. */
  hint?: string
  /** Start / game-over card; omit while playing. */
  overlay?: Overlay | null
  stageRef?: Ref<HTMLDivElement>
  className?: string
}

/** The shared frame every game sits in: hero-haze card, HUD, overlay card. */
export default function Stage({ children, score, best, extra, hint, overlay, stageRef, className = '' }: Props) {
  return (
    <div className={`game-stage ${className}`} ref={stageRef}>
      <div className="game-stage__haze" aria-hidden="true" />
      {children}

      <div className="game-hud">
        {score !== undefined && (
          <span className="game-chip">
            <span className="game-chip__label">Score</span>
            <span className="game-chip__value">{score}</span>
          </span>
        )}
        {best !== undefined && (
          <span className="game-chip">
            <span className="game-chip__label">Best</span>
            <span className="game-chip__value">{best}</span>
          </span>
        )}
        {extra?.map((x) => (
          <span key={x.label} className="game-chip">
            <span className="game-chip__label">{x.label}</span>
            <span className="game-chip__value">{x.value}</span>
          </span>
        ))}
      </div>
      {hint && <span className="game-hint">{hint}</span>}

      {overlay && (
        <div className="game-overlay">
          <div className="game-card">
            <h3 className="game-card__title">{overlay.title}</h3>
            {overlay.body && <p className="game-card__body">{overlay.body}</p>}
            <button type="button" className="game-card__btn" onClick={overlay.onAction} autoFocus>
              {overlay.action}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
