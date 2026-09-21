import { useState } from 'react'
import { motion } from 'framer-motion'
import { Layers, Palette, Type, Box, Check, ArrowRight } from 'lucide-react'

const COLOR_SWATCHES = [
  { name: 'Polar Mist', hex: '#F7F8FC', role: 'Background Canvas', border: '#E2E8F0' },
  { name: 'Orbit Indigo', hex: '#3C4A9E', role: 'Primary Focus', border: 'transparent' },
  { name: 'Nebula Violet', hex: '#7F82DE', role: 'Refractive Accent', border: 'transparent' },
  { name: 'Prismatic Peach', hex: '#FFCEBA', role: 'Optical Caustic', border: 'transparent' },
  { name: 'Deep Lunar', hex: '#0A0B10', role: 'Ink & Typography', border: 'transparent' },
]

export default function DesignLanguage() {
  const [copiedHex, setCopiedHex] = useState<string | null>(null)

  const copyColor = (hex: string) => {
    navigator.clipboard?.writeText(hex)
    setCopiedHex(hex)
    setTimeout(() => setCopiedHex(null), 1800)
  }

  return (
    <section id="design-language" className="content-section language-section">
      <div className="section-container">
        <div className="section-header">
          <motion.span
            className="section-eyebrow"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            03 / System Tokens
          </motion.span>
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            The Orbit Design Language
          </motion.h2>
          <motion.p
            className="section-lead"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            A rigorous token system engineered for both human eyes and generative autonomous systems.
            Every pixel, color grade, and material density is governed by mathematical harmony.
          </motion.p>
        </div>

        {/* Foundations Grid */}
        <div className="language-grid">
          {/* Card 1: Color Spectrum */}
          <div className="language-card">
            <div className="card-top">
              <div className="card-icon-box">
                <Palette size={20} className="card-icon" />
              </div>
              <span className="card-badge">Spectral Palette</span>
            </div>
            <h3 className="card-heading">Harmonic Color System</h3>
            <p className="card-desc">
              Tailored HSL values with low ocular fatigue. Calibrated for light refraction across glass surfaces.
            </p>

            <div className="swatches-list">
              {COLOR_SWATCHES.map((swatch) => (
                <button
                  key={swatch.hex}
                  className="swatch-item"
                  onClick={() => copyColor(swatch.hex)}
                  title="Click to copy hex"
                >
                  <span
                    className="swatch-circle"
                    style={{ backgroundColor: swatch.hex, border: `1px solid ${swatch.border}` }}
                  />
                  <div className="swatch-info">
                    <span className="swatch-name">{swatch.name}</span>
                    <span className="swatch-role">{swatch.role}</span>
                  </div>
                  <span className="swatch-code">
                    {copiedHex === swatch.hex ? <Check size={14} className="copied-check" /> : swatch.hex}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Card 2: Typography Scale */}
          <div className="language-card">
            <div className="card-top">
              <div className="card-icon-box">
                <Type size={20} className="card-icon" />
              </div>
              <span className="card-badge">Typography Hierarchy</span>
            </div>
            <h3 className="card-heading">Fluid Optical Typography</h3>
            <p className="card-desc">
              Geometric sans-serif with negative tracking for headline impact and proportional line heights.
            </p>

            <div className="type-specimens">
              <div className="type-row">
                <span className="type-meta">Display Hero / 96px</span>
                <span className="type-sample display-sample">Build in Orbit.</span>
              </div>
              <div className="type-row">
                <span className="type-meta">Section Header / 42px</span>
                <span className="type-sample h2-sample">Living Interfaces</span>
              </div>
              <div className="type-row">
                <span className="type-meta">Body Regular / 16px</span>
                <span className="type-sample body-sample">
                  High-legibility geometric rendering optimized for dynamic ambient light conditions.
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Material Surfaces & Elevation */}
          <div className="language-card">
            <div className="card-top">
              <div className="card-icon-box">
                <Layers size={20} className="card-icon" />
              </div>
              <span className="card-badge">Depth & Optics</span>
            </div>
            <h3 className="card-heading">Refractive Material Layers</h3>
            <p className="card-desc">
              Multi-plane depth using frosted glass, surface caustics, and subtle perimeter light bounces.
            </p>

            <div className="materials-stack">
              <div className="glass-level level-3">
                <span>Foreground Arc</span>
                <small>Z-Index 3 • High Refraction</small>
              </div>
              <div className="glass-level level-2">
                <span>Content Plane</span>
                <small>Z-Index 2 • Typographic Core</small>
              </div>
              <div className="glass-level level-1">
                <span>Atmospheric Canvas</span>
                <small>Z-Index 1 • Ambient Occlusion</small>
              </div>
            </div>
          </div>

          {/* Card 4: Component Primitives */}
          <div className="language-card">
            <div className="card-top">
              <div className="card-icon-box">
                <Box size={20} className="card-icon" />
              </div>
              <span className="card-badge">Component Kit</span>
            </div>
            <h3 className="card-heading">Interactive Primitives</h3>
            <p className="card-desc">
              Accessible, keyboard-navigable components designed with micro-interactions and tactile feedback.
            </p>

            <div className="primitives-showcase">
              <div className="prim-group">
                <button className="sample-btn primary">
                  <span>Explore System</span>
                  <ArrowRight size={14} />
                </button>
                <button className="sample-btn secondary">View Tokens</button>
              </div>
              <div className="prim-group">
                <span className="sample-badge status-live">Agent Active</span>
                <span className="sample-badge status-sync">Synced</span>
                <span className="sample-badge status-orbit">Zero-G</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
