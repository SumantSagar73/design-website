import { useState, useRef, useEffect } from 'react'
import { Volume2, VolumeX, Sliders, Moon, Droplets } from 'lucide-react'

type StateKey = 'Calm' | 'Active' | 'Attention' | 'Success'
type DesignId = 'semicircle' | 'centered' | 'caustics' | 'haptic' | 'eclipse'

interface StateConfig {
  panel: string
  ring: string
  dur: number
  spread: number
  text: string
  copy: string
  accent: string
  hapticNote: string
}

const STATES: Record<StateKey, StateConfig> = {
  Calm: {
    panel: 'linear-gradient(135deg, #EAF5FA 0%, #C8E6F3 45%, #9FD5EC 100%)',
    ring: 'rgba(43,187,201,',
    dur: 6,
    spread: 1.18,
    text: '#334155',
    copy: 'When everything is under control.',
    accent: '#2bbbc9',
    hapticNote: 'Acoustic Equilibrium · 432 Hz',
  },
  Active: {
    panel: 'linear-gradient(135deg, #DCEFF7 0%, #A6DAEE 42%, #62BFE3 100%)',
    ring: 'rgba(17,152,168,',
    dur: 2.6,
    spread: 0.9,
    text: '#0F172A',
    copy: 'When a conversation is happening.',
    accent: '#1198a8',
    hapticNote: 'Kinetic Synthesis · 587 Hz',
  },
  Attention: {
    panel: 'linear-gradient(135deg, #FDF4E4 0%, #F7E1B8 45%, #EFC981 100%)',
    ring: 'rgba(180,120,20,',
    dur: 1.15,
    spread: 1.02,
    text: '#4A3411',
    copy: 'When something needs action.',
    accent: '#b47814',
    hapticNote: 'Focal Tension · 466 Hz',
  },
  Success: {
    panel: 'linear-gradient(135deg, #EDF7F4 0%, #CDEBE2 45%, #A6DACD 100%)',
    ring: 'rgba(20,120,100,',
    dur: 7, // 5 full rings for harmonic balance
    spread: 0.88,
    text: '#123A31',
    copy: 'When the conversation moves forward.',
    accent: '#147864',
    hapticNote: 'Crystal Resolution · 528 Hz',
  },
}

interface ShowcaseOption {
  id: DesignId
  label: string
  badge: string
}

const SHOWCASE_OPTIONS: ShowcaseOption[] = [
  { id: 'semicircle', label: 'Bottom Semicircles', badge: 'User D2' },
  { id: 'centered', label: 'Centered Full Circles', badge: 'User D1' },
  { id: 'caustics', label: 'Liquid Optical Caustics', badge: 'Concept 1' },
  { id: 'haptic', label: 'Haptic Sound-Sculpture', badge: 'Concept 2' },
  { id: 'eclipse', label: 'Atmospheric Eclipse', badge: 'Concept 3' },
]

export default function TryOrbitSense() {
  const [active, setActive] = useState<StateKey>('Calm')
  const [design, setDesign] = useState<DesignId>('semicircle')
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const st = STATES[active]
  const count = 5
  const stateKeys = Object.keys(STATES) as StateKey[]

  // Concept 2: Web Audio Synthesizer Chords
  const playStateChime = (stateKey: StateKey) => {
    if (!soundEnabled || typeof window === 'undefined') return
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioCtx()
      const chordMap: Record<StateKey, number[]> = {
        Calm: [432, 648, 864],
        Active: [587.33, 880, 1174.66],
        Attention: [466.16, 698.46, 932.33],
        Success: [528, 660, 792, 1056],
      }
      const freqs = chordMap[stateKey]
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, ctx.currentTime)
        const start = ctx.currentTime + idx * 0.04
        gain.gain.setValueAtTime(0, start)
        gain.gain.linearRampToValueAtTime(0.09 / (idx + 1), start + 0.03)
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.8)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(start)
        osc.stop(start + 1.9)
      })
    } catch {
      // Audio context restricted until interaction
    }
  }

  const handleStateClick = (name: StateKey) => {
    setActive(name)
    playStateChime(name)
  }

  // Concept 1: Generative Fluid Caustics Canvas Simulation
  useEffect(() => {
    if (design !== 'caustics') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId = 0
    let time = 0

    const render = () => {
      time += 0.016
      const w = (canvas.width = canvas.offsetWidth)
      const h = (canvas.height = canvas.offsetHeight)

      ctx.clearRect(0, 0, w, h)

      const cx = w / 2
      const cy = h

      const rgbMap: Record<StateKey, { r: number; g: number; b: number }> = {
        Calm: { r: 43, g: 187, b: 201 },
        Active: { r: 17, g: 152, b: 168 },
        Attention: { r: 180, g: 120, b: 20 },
        Success: { r: 20, g: 120, b: 100 },
      }
      const rgb = rgbMap[active]

      // Draw fluid optical caustic rays and contour rings
      const numRings = 7
      for (let r = 1; r <= numRings; r++) {
        ctx.beginPath()
        const radius = (r * 75 + Math.sin(time * 2.5 + r * 0.8) * 14) * st.spread

        // Draw caustic wave contour
        const points = 60
        for (let p = 0; p <= points; p++) {
          const angle = Math.PI + (p / points) * Math.PI // Semicircle top half
          const wave = Math.sin(angle * 6 + time * 3 + r) * 6 * (1 - r / (numRings + 1))
          const distToMouse = Math.hypot(
            cx + (radius + wave) * Math.cos(angle) - mousePos.x * w,
            cy + (radius + wave) * Math.sin(angle) - mousePos.y * h
          )
          const mouseWarp = Math.max(0, 1 - distToMouse / 220) * 18

          const rad = radius + wave + mouseWarp
          const x = cx + rad * Math.cos(angle)
          const y = cy + rad * Math.sin(angle)

          if (p === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }

        const alpha = Math.max(0.08, 0.45 - (r / numRings) * 0.35)
        ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
        ctx.lineWidth = r === 1 ? 2.5 : 1.6
        ctx.stroke()
      }

      // Chromatic dispersion fringe at the epicenter
      ctx.beginPath()
      ctx.arc(cx, cy, 140 * st.spread, Math.PI, 2 * Math.PI)
      ctx.strokeStyle = `rgba(${rgb.r + 30}, ${Math.max(0, rgb.g - 20)}, ${rgb.b + 40}, 0.22)`
      ctx.lineWidth = 4
      ctx.stroke()

      animId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animId)
    }
  }, [design, active, st.spread, mousePos])

  return (
    <section id="try-orbitsense" className="try-section-wrapper">
      <div className="try-outer-container">
        {/* Top Header Row Matching Reference Image */}
        <div className="try-header-row">
          <h2 className="try-headline-left">
            Alive at every touchpoint.
            <br />
            Watch Razorsense respond.
          </h2>
          <p className="try-description-right">
            RazorSense understands that every interaction carries an emotion. So its colour, form,
            shape, and motion move with you. Guiding you, supporting you, like a companion present
            in every action you take and every doubt you have.
          </p>
        </div>

        {/* Team Showcase Variant Switcher */}
        <div className="try-version-bar">
          <span className="try-version-label">
            <Sliders size={14} />
            Showcase Variant:
          </span>
          <div className="try-version-pill">
            {SHOWCASE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`try-version-btn ${design === opt.id ? 'active' : ''}`}
                onClick={() => setDesign(opt.id)}
              >
                <span className="try-variant-tag">{opt.badge}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* The Card Stage */}
        <div
          className="try-card"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            setMousePos({
              x: (e.clientX - rect.left) / rect.width,
              y: (e.clientY - rect.top) / rect.height,
            })
          }}
          style={{
            background:
              design === 'eclipse'
                ? 'linear-gradient(180deg, #090e18 0%, #111a2e 55%, #18243c 100%)'
                : st.panel,
            transition: 'background .7s ease',
          }}
        >
          {/* ============================================================ */}
          {/* USER DESIGN 2: Rings at the bottom as semicircles (Untouched)*/}
          {/* ============================================================ */}
          {design === 'semicircle' && (
            <div className="try-rings-bottom-wrapper">
              {Array.from({ length: count }).map((_, i) => {
                const size = Math.round((380 + i * 200) * st.spread)
                const alpha = Math.max(0.08, 0.42 - i * 0.07)
                return (
                  <div
                    key={`semi-${active}-${i}`}
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: '50%',
                      width: `${size}px`,
                      height: `${size}px`,
                      borderRadius: '50%',
                      border: `1.8px solid ${st.ring}${alpha.toFixed(2)})`,
                      transformOrigin: 'center center',
                      transform: 'translate(-50%, 50%)',
                      transition: 'border-color .6s ease, width .6s ease, height .6s ease',
                      animation: `breatheSemicircle ${st.dur}s ease-in-out ${(i * st.dur) / 8}s infinite`,
                    }}
                  />
                )
              })}
            </div>
          )}

          {/* ============================================================ */}
          {/* USER DESIGN 1: Rings centered in the middle (Untouched)      */}
          {/* ============================================================ */}
          {design === 'centered' && (
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
          )}

          {/* ============================================================ */}
          {/* CONCEPT 1: Liquid Optical Caustics (Generative Canvas Light) */}
          {/* ============================================================ */}
          {design === 'caustics' && (
            <>
              <canvas ref={canvasRef} className="try-caustics-canvas" />
              <div
                style={{
                  position: 'absolute',
                  bottom: '24px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,0.7)',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: '#475569',
                  pointerEvents: 'none',
                }}
              >
                <Droplets size={12} />
                Hover or drag across canvas to warp fluid caustics
              </div>
            </>
          )}

          {/* ============================================================ */}
          {/* CONCEPT 2: Haptic Sound-Sculpture (Physical Acoustic Deck)   */}
          {/* ============================================================ */}
          {design === 'haptic' && (
            <div className="try-haptic-rotary-wrapper">
              {/* Concentric etched physical instrument dial */}
              {Array.from({ length: count }).map((_, i) => {
                const size = Math.round((340 + i * 140) * st.spread)
                const alpha = Math.max(0.08, 0.45 - i * 0.08)
                return (
                  <div
                    key={`haptic-ring-${active}-${i}`}
                    style={{
                      position: 'absolute',
                      width: `${size}px`,
                      height: `${size}px`,
                      borderRadius: '50%',
                      border: `1.5px dashed ${st.ring}${alpha.toFixed(2)})`,
                      animation: `breathe ${st.dur * 1.2}s ease-in-out ${(i * st.dur) / 10}s infinite`,
                    }}
                  />
                )
              })}

              {/* Rotary Console Centerpiece */}
              <div
                className="try-haptic-dial"
                style={{
                  width: '260px',
                  height: '260px',
                  transform: `rotate(${active === 'Calm' ? '0' : active === 'Active' ? '90' : active === 'Attention' ? '180' : '270'}deg)`,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '16px',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: st.accent,
                    boxShadow: `0 0 10px ${st.accent}`,
                  }}
                />
              </div>

              {/* Audio and Haptic Frequency Indicator */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '26px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  zIndex: 20,
                  pointerEvents: 'auto',
                }}
              >
                <button
                  type="button"
                  className="try-audio-badge-btn"
                  onClick={() => {
                    const next = !soundEnabled
                    setSoundEnabled(next)
                    if (next) playStateChime(active)
                  }}
                >
                  {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                  {soundEnabled ? 'Harmonic Sound: Active' : 'Enable Crystal Chimes'}
                </button>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#475569',
                    background: 'rgba(255,255,255,0.7)',
                    padding: '5px 12px',
                    borderRadius: '999px',
                  }}
                >
                  {st.hapticNote}
                </span>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* CONCEPT 3: Atmospheric Eclipse (Cinematic Spatial Horizon)  */}
          {/* ============================================================ */}
          {design === 'eclipse' && (
            <div className="try-eclipse-sky">
              {/* Solar / Spectral Corona Halo Breathing */}
              <div
                className="try-corona-glow"
                style={{
                  width: '740px',
                  height: '740px',
                  transform: 'translateX(-50%)',
                  background: `radial-gradient(circle, ${st.ring}0.65) 0%, ${st.ring}0.22) 48%, transparent 72%)`,
                  filter: 'blur(40px)',
                  transition: 'background .8s ease',
                }}
              />

              {/* Rising Obsidian Moon Silhouette */}
              <div className="try-eclipse-moon" />

              {/* Horizon Aurora Arc Indicator */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 14px',
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(12px)',
                  color: '#94a3b8',
                  fontSize: '12px',
                  fontWeight: 500,
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                <Moon size={12} color="#e2e8f0" />
                Celestial Horizon Phase: {active}
              </div>
            </div>
          )}

          {/* Center Stage UI: Tabs and Copy Statement */}
          <div
            className="try-center-content"
            style={{
              justifyContent:
                design === 'centered' || design === 'haptic' ? 'center' : 'flex-start',
              paddingTop: design === 'centered' || design === 'haptic' ? '0' : '62px',
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
                    onClick={() => handleStateClick(name)}
                    style={{
                      appearance: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: '17px',
                      fontWeight: 500,
                      padding: '16px 34px',
                      borderRadius: '999px',
                      background: on
                        ? design === 'eclipse'
                          ? 'rgba(255,255,255,0.95)'
                          : 'rgba(255,255,255,.94)'
                        : design === 'eclipse'
                          ? 'rgba(255,255,255,0.12)'
                          : 'rgba(255,255,255,.42)',
                      color: on ? '#0F172A' : design === 'eclipse' ? '#94a3b8' : '#334155',
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
                color: design === 'eclipse' ? '#cbd5e1' : st.text,
                transition: 'color .5s ease',
                marginTop: design === 'centered' || design === 'haptic' ? '0' : '10px',
              }}
            >
              {st.copy}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
