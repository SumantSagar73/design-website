import { useState } from 'react'

type StateKey = 'Calm' | 'Active' | 'Alert' | 'Resolve'

interface StateConfig {
  panel: string
  ring: string
  dur: number
  spread: number
  text: string
  copy: string
}

const STATES: Record<StateKey, StateConfig> = {
  Calm: {
    panel: 'linear-gradient(135deg, #EAF5FA 0%, #C8E6F3 45%, #9FD5EC 100%)',
    ring: 'rgba(43,187,201,',
    dur: 6,
    spread: 1.18,
    text: '#334155',
    copy: 'When everything is under control',
  },
  Active: {
    panel: 'linear-gradient(135deg, #DCEFF7 0%, #A6DAEE 42%, #62BFE3 100%)',
    ring: 'rgba(17,152,168,',
    dur: 2.6,
    spread: 0.9,
    text: '#0F172A',
    copy: 'When moving forward',
  },
  Alert: {
    panel: 'linear-gradient(135deg, #FDF4E4 0%, #F7E1B8 45%, #EFC981 100%)',
    ring: 'rgba(180,120,20,',
    dur: 1.15,
    spread: 1.02,
    text: '#4A3411',
    copy: 'When action is needed',
  },
  Resolve: {
    panel: 'linear-gradient(135deg, #EDF7F4 0%, #CDEBE2 45%, #A6DACD 100%)',
    ring: 'rgba(20,120,100,',
    dur: 7, // 5 full rings for harmonic balance
    spread: 0.88,
    text: '#123A31',
    copy: 'When reaching a conclusion',
  },
}

export default function TryOrbitSense() {
  const [active, setActive] = useState<StateKey>('Calm')
  /* v1 is the live design; v2 is the orbit-showcase arc, side by side to compare. */
  const [variant, setVariant] = useState<'v1' | 'v2'>('v1')

  const st = STATES[active]
  const count = 5
  const stateKeys = Object.keys(STATES) as StateKey[]

  return (
    <section id="try-myorbit" className="try-section-wrapper">
      <div className="try-outer-container">
        {/* Top Header Row Matching Reference Image */}
        <div className="try-header-row">
          <h2 className="try-headline-left">
            Designed for clarity
            <br />
            in a connected world
          </h2>
          <p className="try-description-right">
            MyOrbit holds every component, interaction, and experience into one connected system —
            making complexity feel simple, intentional, and consistent.
          </p>
        </div>

        {/* Compare the live stage with the orbit-showcase arc. */}
        <div className="try-variant-switch" role="tablist" aria-label="Stage design">
          {(['v1', 'v2'] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={variant === v}
              className={`try-variant-btn ${variant === v ? 'is-active' : ''}`}
              onClick={() => setVariant(v)}
            >
              {v === 'v1' ? 'V1 · Rings' : 'V2 · Orbit arc'}
            </button>
          ))}
        </div>

        {variant === 'v2' ? (
          /* ---------------------------------------------- V2: orbit arc */
          /* Background comes from the V1 panel too, so V2 carries the same
             depth of colour rather than its own washed-out tint. */
          <div className="tryv2-stage" style={{ background: st.panel }}>
            {/* Backlight is the state's own ring hue, kept faint. */}
            <div className="tryv2-backlight" style={{ background: `${st.ring}0.18)` }} />

            {/* Concentric arcs centred below the card, so only their tops show.
                They breathe outward at the state's own tempo, and take their
                colour from the V1 ring palette so both variants read alike.
                Only the alpha differs per arc, keeping V2's own weighting. */}
            <svg className="tryv2-arcs" viewBox="0 0 1000 480" fill="none" preserveAspectRatio="xMidYMid slice">
              {[
                { r: 290, alpha: 0.1, width: 1 },
                { r: 390, alpha: 0.22, width: 1.2 },
                { r: 490, alpha: 0.08, width: 1 },
              ].map((arc, i) => (
                <circle
                  key={arc.r}
                  className="tryv2-arc"
                  cx="500"
                  cy="560"
                  r={arc.r}
                  stroke={`${st.ring}${arc.alpha})`}
                  strokeWidth={arc.width}
                  style={{
                    animationDuration: `${st.dur}s`,
                    animationDelay: `${(i * st.dur) / 6}s`,
                  }}
                />
              ))}
            </svg>

            {/* Pills sit on the arc: the outer two ride lower than the inner two. */}
            <div className="tryv2-pills">
              {stateKeys.map((name, i) => {
                const on = name === active
                const outer = i === 0 || i === stateKeys.length - 1
                return (
                  <button
                    key={name}
                    type="button"
                    className={`tryv2-pill ${on ? 'is-active' : ''} ${outer ? 'is-outer' : ''}`}
                    onClick={() => setActive(name)}
                    aria-pressed={on}
                  >
                    {on && <span className="tryv2-dot" style={{ background: `${st.ring}1)` }} />}
                    {name}
                  </button>
                )
              })}
            </div>

            <p className="tryv2-caption" key={active}>
              {st.copy}
            </p>
          </div>
        ) : (
        /* ---------------------------------------------- V1: the live rings */
        <div
          className="try-card"
          style={{
            background: st.panel,
            transition: 'background .7s ease',
          }}
        >
          {/* Concentric rings, centred in the card */}
          <div className="try-rings-wrapper">
            {Array.from({ length: count }).map((_, i) => {
              const size = Math.round((300 + i * 190) * st.spread)
              const alpha = Math.max(0.06, 0.38 - i * 0.07)
              return (
                <div
                  key={`center-${active}-${i}`}
                  style={{
                    position: 'absolute',
                    width: `${size}px`,
                    height: `${size}px`,
                    borderRadius: '50%',
                    border: `1.5px solid ${st.ring}${alpha.toFixed(2)})`,
                    transformOrigin: 'center',
                    transition: 'border-color .6s ease, width .6s ease, height .6s ease',
                    animation: `breathe ${st.dur}s ease-in-out ${(i * st.dur) / 8}s infinite`,
                  }}
                />
              )
            })}
          </div>

          {/* Center Stage UI: Tabs and Copy Statement */}
          <div
            className="try-center-content"
            style={{
              justifyContent: 'center',
              paddingTop: '0',
            }}
          >
            {/* State Selection Tabs */}
            <div className="try-tabs-row">
              {stateKeys.map((name) => {
                const on = name === active
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setActive(name)}
                    className="try-tab"
                    style={{
                      appearance: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontWeight: 500,
                      borderRadius: '999px',
                      background: on ? 'rgba(255,255,255,.94)' : 'rgba(255,255,255,.42)',
                      color: on ? '#0F172A' : '#334155',
                      boxShadow: on
                        ? '0 10px 28px rgba(15,23,42,.14)'
                        : 'inset 0 0 0 1px rgba(255,255,255,.6)',
                      transition: 'background .3s ease, color .3s ease, box-shadow .3s ease',
                    }}
                  >
                    {name}
                  </button>
                )
              })}
            </div>

            {/* Central Statement Copy */}
            <div
              className="try-copy-text"
              style={{
                color: st.text,
                transition: 'color .5s ease',
                marginTop: '0',
              }}
            >
              {st.copy}
            </div>
          </div>
        </div>
        )}
      </div>
    </section>
  )
}
