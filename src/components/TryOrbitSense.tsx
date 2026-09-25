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
    panel: 'linear-gradient(135deg, #B6CCF5 0%, #91B2EF 50%, #6D98EA 100%)',
    ring: 'rgba(43,187,201,',
    dur: 6,
    spread: 1.18,
    text: '#334155',
    copy: 'When everything is under control',
  },
  Active: {
    panel: 'linear-gradient(135deg, #B5EDF2 0%, #88DCE4 50%, #5BCCD6 100%)',
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

  const st = STATES[active]
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

        {/* Orbit Arc Stage (V2) */}
        <div className="tryv2-stage" style={{ background: st.panel }}>
          <div className="tryv2-backlight" style={{ background: `${st.ring}0.18)` }} />

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
      </div>
    </section>
  )
}
