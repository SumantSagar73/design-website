import { useState } from 'react'

export type StateKey = 'Calm' | 'Active' | 'Alert' | 'Resolve'

export interface StateConfig {
  panel: string
  ring: string
  dur: number
  spread: number
  text: string
  copy: string
}

export const STATES: Record<StateKey, StateConfig> = {
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

/**
 * Preserved V1 design: Concentric breathing rings centered around stage copy.
 */
export default function TryOrbitV1Rings() {
  const [active, setActive] = useState<StateKey>('Calm')
  const st = STATES[active]
  const count = 5
  const stateKeys = Object.keys(STATES) as StateKey[]

  return (
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
  )
}
