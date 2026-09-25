import { useState, useRef } from 'react'
import { STATES, type StateKey } from './TryOrbitV1Rings'

/**
 * Preserved V3 design: Dynamic orbit rotation with central gravitational nucleus hub,
 * radar sweep, concentric tracks, and circular orbiting badges.
 */
export default function TryOrbitV3Rotation() {
  const [active, setActive] = useState<StateKey>('Calm')
  const [hoveredState, setHoveredState] = useState<StateKey | null>(null)
  const [cursorVisible, setCursorVisible] = useState(false)
  const [tooltipText, setTooltipText] = useState('')
  const cursorTagRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (cursorTagRef.current) {
      cursorTagRef.current.style.left = `${e.clientX}px`
      cursorTagRef.current.style.top = `${e.clientY}px`
    }
  }

  const handleBadgeEnter = (name: StateKey, e: React.MouseEvent) => {
    setHoveredState(name)
    setTooltipText(STATES[name].copy)
    setCursorVisible(true)
    if (cursorTagRef.current) {
      cursorTagRef.current.style.left = `${e.clientX}px`
      cursorTagRef.current.style.top = `${e.clientY}px`
    }
  }

  const handleBadgeLeave = () => {
    setHoveredState(null)
    setCursorVisible(false)
  }

  const handleContainerMouseLeave = () => {
    setHoveredState(null)
    setCursorVisible(false)
  }

  const stateKeys = Object.keys(STATES) as StateKey[]
  const currentKey = hoveredState || active

  return (
    <div className="v3-wrapper-relative" style={{ position: 'relative' }}>
      <div
        className={`v2-orbit-container theme-${currentKey.toLowerCase()}`}
        style={{
          background: STATES[currentKey].panel,
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleContainerMouseLeave}
      >
        {/* Ambient Radar / Energy Field linking all 4 rings */}
        <div className="v3-radar-sweep" />

        {/* Concentric Background Rings with individual state tracks */}
        <div className={`v2-ring v2-ring-1 ${currentKey === 'Calm' ? 'is-active-track' : ''}`} />
        <div className={`v2-ring v2-ring-2 ${currentKey === 'Active' ? 'is-active-track' : ''}`} />
        <div className={`v2-ring v2-ring-3 ${currentKey === 'Alert' ? 'is-active-track' : ''}`} />
        <div className={`v2-ring v2-ring-4 ${currentKey === 'Resolve' ? 'is-active-track' : ''}`} />

        {/* Central Gravitational Nucleus Hub */}
        <div className="v3-core-hub">
          <div className="v3-core-wave v3-core-wave-1" />
          <div className="v3-core-wave v3-core-wave-2" />
          <div
            className="v3-core-sphere"
            style={{
              boxShadow: `0 0 35px -5px ${STATES[currentKey].ring}0.5), 0 10px 25px rgba(15, 23, 42, 0.12)`,
            }}
          >
            <img
              src="/myorbit-logo.png"
              alt="MyOrbit"
              className="v3-core-logo"
            />
            <span className="v3-core-label">{currentKey}</span>
          </div>
        </div>

        {/* Circular Orbiting Badges */}
        {stateKeys.map((name) => {
          const isSelected = name === active
          return (
            <button
              key={name}
              type="button"
              className={`v2-orbit-badge v2-pill-${name.toLowerCase()} ${isSelected ? 'is-selected' : ''}`}
              onMouseEnter={(e) => handleBadgeEnter(name, e)}
              onMouseLeave={handleBadgeLeave}
              onClick={() => setActive(name)}
              aria-label={`${name}: ${STATES[name].copy}`}
            >
              <span className={`v2-status-dot v2-dot-${name.toLowerCase()}`} />
              <span className="v2-badge-label">{name}</span>
            </button>
          )
        })}

        {/* Anchored Bottom Statement Copy Pill */}
        <div className="v3-caption-pill" key={currentKey}>
          <span className={`v2-status-dot v2-dot-${currentKey.toLowerCase()}`} />
          <span className="v3-caption-state">{currentKey}</span>
          <span className="v3-caption-divider" />
          <span className="v3-caption-copy">{STATES[currentKey].copy}</span>
        </div>
      </div>

      {/* Dynamic Follow-Cursor Tooltip Tag */}
      <div
        ref={cursorTagRef}
        className={`v2-cursor-tag ${cursorVisible ? 'is-visible' : ''}`}
      >
        {tooltipText}
      </div>
    </div>
  )
}
