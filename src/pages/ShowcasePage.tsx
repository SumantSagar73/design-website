import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  Play,
  Pause,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ArrowLeft,
  Volume2,
  RefreshCw,
  Copy,
  Check,
  Activity,
  User,
  Search
} from 'lucide-react'

// Ray / MyOperator 4-petal floral clover glyph
const CloverIcon = ({ className = "w-4 h-4 text-emerald-500", size = 16 }: { className?: string, size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 4a3.5 3.5 0 0 0-3.5 3.5c0 .72.22 1.39.6 1.95A3.49 3.49 0 0 0 7.5 9 3.5 3.5 0 1 0 11 12.5c0-.17-.01-.34-.04-.5.56.38 1.23.6 1.95.6a3.5 3.5 0 1 0 3.5-3.5c-.72 0-1.39.22-1.95.6.03-.16.04-.33.04-.5A3.5 3.5 0 0 0 12 4z" />
  </svg>
)

type MosaicVersion = 'mondrian' | 'panoramic-drift' | 'dark-caustics' | 'interactive-lab'

export default function ShowcasePage({ onBack }: { onBack?: () => void }) {
  const [activeVersion, setActiveVersion] = useState<MosaicVersion>('mondrian')
  const [invoiceCreated, setInvoiceCreated] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [audioProgress, setAudioProgress] = useState(42)
  const [activeTab, setActiveTab] = useState<'all' | 'unassigned' | 'resolved'>('all')
  const [switch1, setSwitch1] = useState(true)
  const [switch2, setSwitch2] = useState(false)
  const [activeStep, setActiveStep] = useState(2)
  const [copied, setCopied] = useState(false)
  const [globalShimmer, setGlobalShimmer] = useState(true)


  const canvasRef = useRef<HTMLDivElement>(null)

  // Auto step cycle for AI Thinking state
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((s) => (s >= 3 ? 1 : s + 1))
    }, 3200)
    return () => clearInterval(timer)
  }, [])

  // Audio bar mock progress
  useEffect(() => {
    if (!isPlayingAudio) return
    const id = setInterval(() => {
      setAudioProgress((p) => (p >= 100 ? 0 : p + 3))
    }, 240)
    return () => clearInterval(id)
  }, [isPlayingAudio])

  const handleInvoiceClick = () => {
    setInvoiceCreated(true)
    setTimeout(() => setInvoiceCreated(false), 2400)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`mosaic-showcase-root theme-${activeVersion}`}>
      {/* Top Header Bar */}
      <header className="mosaic-nav-header">
        <div className="mosaic-nav-inner">
          <div className="mosaic-nav-left">
            <button
              onClick={() => {
                if (onBack) onBack()
                else window.location.href = '/'
              }}
              className="mosaic-back-button"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>Back to OrbitSense</span>
            </button>
            <div className="mosaic-breadcrumb">
              <span className="breadcrumb-slash">/</span>
              <span className="breadcrumb-current">Storybook Component Mosaic</span>
            </div>
          </div>

          <div className="mosaic-nav-center">
            <span className="mosaic-status-chip">
              <span className="status-chip-dot" />
              <span>Storybook v3.2 Production</span>
            </span>
          </div>

          <div className="mosaic-nav-right">
            <button onClick={handleCopyLink} className="mosaic-ghost-action-btn">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
              <span>{copied ? 'Copied' : 'Share View'}</span>
            </button>
            <a
              href="https://storybook-npm-psi.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="mosaic-primary-link"
            >
              <span>Explore Storybook</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Title Section */}
      <section className="mosaic-headline-section">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mosaic-headline-inner"
        >
          <h1 className="mosaic-main-headline">Every detail, deliberate.</h1>
          <p className="mosaic-subheadline">
            A tessellated spatial canvas of living Storybook components, partitioned across varied rectangular scales.
          </p>

          {/* 4 Version Switchers */}
          <div className="mosaic-tabs-wrapper" role="tablist">
            <button
              role="tab"
              aria-selected={activeVersion === 'mondrian'}
              onClick={() => setActiveVersion('mondrian')}
              className={`mosaic-tab-btn ${activeVersion === 'mondrian' ? 'is-active' : ''}`}
            >
              <span className="tab-title">V1: Mondrian Blueprint</span>
              <span className="tab-desc">Exact subdivision from diagram</span>
            </button>

            <button
              role="tab"
              aria-selected={activeVersion === 'panoramic-drift'}
              onClick={() => setActiveVersion('panoramic-drift')}
              className={`mosaic-tab-btn ${activeVersion === 'panoramic-drift' ? 'is-active' : ''}`}
            >
              <span className="tab-title">V2: Panoramic Drift</span>
              <span className="tab-desc">Expansive animated conveyor</span>
            </button>

            <button
              role="tab"
              aria-selected={activeVersion === 'dark-caustics'}
              onClick={() => setActiveVersion('dark-caustics')}
              className={`mosaic-tab-btn ${activeVersion === 'dark-caustics' ? 'is-active' : ''}`}
            >
              <span className="tab-title">V3: Optical Caustics</span>
              <span className="tab-desc">OLED depth & luminous caustics</span>
            </button>

            <button
              role="tab"
              aria-selected={activeVersion === 'interactive-lab'}
              onClick={() => setActiveVersion('interactive-lab')}
              className={`mosaic-tab-btn ${activeVersion === 'interactive-lab' ? 'is-active' : ''}`}
            >
              <span className="tab-title">V4: Interactive Lab</span>
              <span className="tab-desc">Live state triggers & controls</span>
            </button>
          </div>
        </motion.div>
      </section>

      {/* Main Canvas Area */}
      <main className="mosaic-canvas-viewport">
        <AnimatePresence mode="wait">
          {/* =========================================================================
              VERSION 1: MONDRIAN BLUEPRINT (Matching the Exact Diagram Layout)
              ========================================================================= */}
          {activeVersion === 'mondrian' && (
            <motion.div
              key="mondrian-version"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4 }}
              className="mosaic-blueprint-canvas"
            >
              <div className="mosaic-grid-container" ref={canvasRef}>
                {/* ----------------- ROW 1: TOP SECTION ----------------- */}
                
                {/* 1.1: Tall left vertical card */}
                <div className="mosaic-cell cell-tall-left">
                  <div className="cell-tag tag-top">FEED</div>

                  <div className="cell-feed-content">
                    <div className="feed-header">
                      <Activity className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                      <span className="text-[11px] font-bold text-slate-700 uppercase">Live Queue</span>
                    </div>
                    <div className="feed-items-list">
                      <div className="feed-item active">
                        <span className="feed-dot online" />
                        <span className="feed-text">SIP 104 • 12ms</span>
                      </div>
                      <div className="feed-item">
                        <span className="feed-dot idle" />
                        <span className="feed-text">SIP 108 • 16ms</span>
                      </div>
                      <div className="feed-item">
                        <span className="feed-dot idle" />
                        <span className="feed-text">SIP 201 • 9ms</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 1.2: Vertical strip */}
                <div className="mosaic-cell cell-vert-strip-1">
                  <div className="cell-tag tag-top">VOICE</div>
                  <div className="vert-sound-meter">
                    {[65, 40, 85, 30, 95, 50, 75, 20].map((h, i) => (
                      <div
                        key={i}
                        className="vert-meter-bar"
                        style={{ height: `${h}%`, animationDelay: `${i * 120}ms` }}
                      />
                    ))}
                  </div>
                </div>

                {/* 1.3: Two stacked blocks column */}
                <div className="mosaic-cell-group cell-stacked-col-1">
                  <div className="mosaic-cell cell-stacked-top">
                    <div className="cell-tag tag-top">AVATAR</div>
                    <div className="avatar-group-cluster">
                      <div className="avatar-pill"><User className="w-3.5 h-3.5 text-blue-600" /></div>
                      <span className="avatar-name">Sarah J.</span>
                    </div>
                  </div>
                  <div className="mosaic-cell cell-stacked-bot">
                    <div className="cell-tag tag-top">ALERT</div>
                    <div className="mini-alert-pill">
                      <CloverIcon className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Sync ready</span>
                    </div>
                  </div>
                </div>

                {/* 1.4: Upper center wide card: Call Recording Audio Playback Bar */}
                <div className="mosaic-cell cell-wide-audio">
                  <div className="cell-tag tag-top">AUDIO MEDIA</div>
                  <div className="cell-audio-bar-inner">
                    <button
                      onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                      className="audio-play-btn-mini"
                    >
                      {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    </button>
                    <div className="audio-wave-scrub">
                      {[30, 55, 80, 45, 90, 60, 35, 75, 40, 95, 70, 50, 85, 60, 30, 70, 90, 45, 60, 80].map((ht, i) => {
                        const isDone = (i / 20) * 100 <= audioProgress
                        return (
                          <div
                            key={i}
                            className={`wave-tick ${isDone ? 'done' : ''}`}
                            style={{ height: `${ht}%` }}
                          />
                        )
                      })}
                    </div>
                    <span className="audio-timer-pill">04:28</span>
                  </div>
                </div>

                {/* 1.5: Upper right: 2x2 micro square cluster */}
                <div className="mosaic-cell cell-square-2x2-a">
                  <div className="cell-tag tag-top">BADGES</div>
                  <div className="cluster-2x2-grid">
                    <span className="micro-badge live">LIVE</span>
                    <span className="micro-badge ok">200</span>
                    <span className="micro-badge warn">404</span>
                    <span className="micro-badge draft">DEV</span>
                  </div>
                </div>

                {/* 1.6: Upper right: Vertical bar & 2x2 grid */}
                <div className="mosaic-cell cell-vert-strip-2">
                  <div className="cell-tag tag-top">TOGGLE</div>
                  <div className="mini-switch-column">
                    <button
                      onClick={() => setSwitch1(!switch1)}
                      className={`mini-toggle-pill ${switch1 ? 'on' : ''}`}
                    >
                      <span className="toggle-thumb" />
                    </button>
                    <button
                      onClick={() => setSwitch2(!switch2)}
                      className={`mini-toggle-pill ${switch2 ? 'on' : ''}`}
                    >
                      <span className="toggle-thumb" />
                    </button>
                  </div>
                </div>

                {/* 1.7: Upper right: 2x3 micro squares */}
                <div className="mosaic-cell cell-square-2x3-b">
                  <div className="cell-tag tag-top">TAGS</div>
                  <div className="cluster-2x3-grid">
                    <span className="tiny-tag">#SIP</span>
                    <span className="tiny-tag">#IVR</span>
                    <span className="tiny-tag">#RAY</span>
                    <span className="tiny-tag">#BOT</span>
                    <span className="tiny-tag">#AI</span>
                    <span className="tiny-tag">#API</span>
                  </div>
                </div>

                {/* ----------------- ROW 2: UPPER MIDDLE HERO SECTION ----------------- */}

                {/* 2.1: Left Middle Medium Block */}
                <div className="mosaic-cell cell-left-tabs">
                  <div className="cell-tag tag-top">TABS</div>
                  <div className="storybook-tabs-row">
                    <button
                      onClick={() => setActiveTab('all')}
                      className={`tab-item ${activeTab === 'all' ? 'active' : ''}`}
                    >
                      All (48)
                    </button>
                    <button
                      onClick={() => setActiveTab('unassigned')}
                      className={`tab-item ${activeTab === 'unassigned' ? 'active' : ''}`}
                    >
                      Pending
                    </button>
                  </div>
                  <div className="tab-body-preview">
                    <div className="tab-line shimmer-fx" />
                    <div className="tab-line-short shimmer-fx" />
                  </div>
                </div>

                {/* 2.2: Middle Wide Card: Ray Insights */}
                <div className="mosaic-cell cell-insights-hero">
                  <div className="cell-tag tag-top">INSIGHTS</div>
                  <div className="insights-diagram-body">
                    <div className="insights-diagram-header">
                      <CloverIcon className="w-4 h-4 text-emerald-600 mr-2" />
                      <span className="insights-diagram-brand">RAY INSIGHTS</span>
                    </div>
                    <p className="insights-diagram-text">
                      <span className="insights-bold-green">Payment has gone up by 12%</span>{' '}
                      <span className="insights-dark-slate">since the last month</span>
                    </p>
                  </div>
                </div>

                {/* 2.3: Medium Wide Block next to Insights */}
                <div className="mosaic-cell cell-button-caustic-block">
                  <div className="cell-tag tag-top">BUTTON</div>
                  <div className="button-caustic-canvas">
                    <div className="caustic-grid-lines" />
                    <div className="caustic-fluid-blob" />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={handleInvoiceClick}
                      className="diagram-tactile-btn"
                    >
                      <span className="specular-line" />
                      <span>{invoiceCreated ? 'Created ✓' : 'Create invoice'}</span>
                    </motion.button>
                  </div>
                </div>

                {/* 2.4: Middle Right: Tall Card column */}
                <div className="mosaic-cell cell-col-tall-right">
                  <div className="cell-tag tag-top">TOOLTIP</div>
                  <div className="tooltip-storybook-box">
                    <div className="tooltip-bubble">
                      <span>99.98% SLA Guaranteed</span>
                      <div className="tooltip-carat" />
                    </div>
                    <span className="tooltip-trigger-label">Active Node</span>
                  </div>
                </div>

                {/* ----------------- ROW 3: MAIN CORE HERO REGION ----------------- */}

                {/* 3.1: Large Square on the Left: CARD (₹32k Payment) */}
                <div className="mosaic-cell cell-card-large-hero">
                  <div className="cell-tag tag-top">CARD</div>
                  <div className="card-large-hero-inner">
                    <div className="card-top-content">
                      <span className="card-subtitle-text">Collected Payment</span>
                      <div className="card-figure-row">
                        <span className="card-figure-bold">₹32k</span>
                        <span className="card-trend-badge">
                          <span className="trend-arrow">▲</span> 14% from last week
                        </span>
                      </div>
                    </div>

                    {/* Sparkline Graph */}
                    <div className="card-sparkline-area">
                      <svg viewBox="0 0 240 70" className="w-full h-full" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="cardHeroGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M 0,55 Q 35,53 60,40 T 120,30 T 170,18 T 220,14 L 240,16 L 240,70 L 0,70 Z"
                          fill="url(#cardHeroGrad)"
                        />
                        <path
                          d="M 0,55 Q 35,53 60,40 T 120,30 T 170,18 T 220,14 L 240,16"
                          fill="none"
                          stroke="#2563eb"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                        <circle cx="240" cy="16" r="3.5" fill="#2563eb" />
                        <circle cx="240" cy="16" r="8" fill="#3b82f6" opacity="0.3" className="animate-ping" />
                      </svg>
                    </div>

                    {/* Footer */}
                    <div className="card-bottom-row">
                      <div className="flex items-center gap-2">
                        <CloverIcon className="w-4 h-4 text-emerald-500" />
                        <span className="text-[12.5px] font-semibold text-slate-800">Deep dive into trends</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* 3.2: Two tall vertical columns next to Card */}
                <div className="mosaic-cell cell-vert-col-a">
                  <div className="cell-tag tag-top">PROGRESS</div>
                  <div className="vert-progress-track">
                    <div className="vert-progress-fill" style={{ height: '74%' }} />
                    <span className="vert-progress-val">74%</span>
                  </div>
                </div>

                <div className="mosaic-cell cell-vert-col-b">
                  <div className="cell-tag tag-top">STATUS</div>
                  <div className="vert-dots-column">
                    <span className="dot-node green-pulse" />
                    <span className="dot-node blue" />
                    <span className="dot-node amber" />
                    <span className="dot-node slate" />
                  </div>
                </div>

                {/* 3.3: Large Center-Right Vertical Block: Thinking State */}
                <div className="mosaic-cell cell-thinking-large-hero">
                  <div className="cell-tag tag-top">THINKING STATE</div>
                  <div className="thinking-diagram-inner">
                    <div className="thinking-diagram-top">
                      <CloverIcon className="w-4 h-4 text-emerald-500 animate-spin mr-2" />
                      <span className="thinking-top-title">Initiating Onboarding...</span>
                    </div>

                    <div className="thinking-timeline">
                      <div className="timeline-spine" />
                      
                      <div className={`timeline-step ${activeStep >= 1 ? 'done' : ''}`}>
                        <div className="step-disc">
                          {activeStep > 1 ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <span className="disc-pulse" />}
                        </div>
                        <span className="step-name">Setting up team...</span>
                      </div>

                      <div className={`timeline-step ${activeStep >= 2 ? 'active' : ''}`}>
                        <div className="step-disc">
                          {activeStep > 2 ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : activeStep === 2 ? <Sparkles className="w-3 h-3 text-emerald-500 animate-pulse" /> : <span className="disc-idle" />}
                        </div>
                        <span className="step-name">Generating your persona...</span>
                      </div>

                      <div className={`timeline-step ${activeStep >= 3 ? 'pending' : ''}`}>
                        <div className="step-disc">
                          <span className={activeStep === 3 ? "disc-pulse" : "disc-idle"} />
                        </div>
                        <span className="step-name">Linking Storybook tokens...</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3.4: Vertical separator column */}
                <div className="mosaic-cell cell-vert-divider">
                  <div className="cell-tag tag-top">SLIDER</div>
                  <div className="vert-slider-mock">
                    <div className="slider-track" />
                    <div className="slider-handle" />
                  </div>
                </div>

                {/* 3.5: Large Far-Right Hero: Skeleton Loader */}
                <div className="mosaic-cell cell-skeleton-hero">
                  <div className="cell-tag tag-bottom">SKELETON LOADER</div>
                  <div className="skeleton-diagram-layout">
                    <div className="skeleton-line-xs shimmer-fx" />
                    <div className="skeleton-line-sm shimmer-fx" />
                    <div className="skeleton-box-large shimmer-fx" />
                    <div className="skeleton-row-duo">
                      <div className="skeleton-box-half shimmer-fx" />
                      <div className="skeleton-box-half shimmer-fx" />
                    </div>
                    <div className="skeleton-box-footer shimmer-fx" />
                  </div>
                </div>

                {/* ----------------- ROW 4: LOWER MIDDLE REGION ----------------- */}

                {/* 4.1: Lower Left Medium Box */}
                <div className="mosaic-cell cell-lower-left-box">
                  <div className="cell-tag tag-top">SEARCH</div>
                  <div className="search-field-mini">
                    <Search className="w-3.5 h-3.5 text-slate-400 mr-2" />
                    <span className="search-placeholder">Find component...</span>
                  </div>
                </div>

                {/* 4.2: Lower Wide Horizontal Center Card */}
                <div className="mosaic-cell cell-lower-wide-center">
                  <div className="cell-tag tag-top">AI BOT IDENTITY CARD</div>
                  <div className="bot-identity-row">
                    <div className="bot-identity-avatar">
                      <CloverIcon className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="bot-identity-info">
                      <h4 className="bot-identity-title">Ray Voice Companion v2.4</h4>
                      <p className="bot-identity-sub">Automatic human escalation armed • 99.4% intent resolution</p>
                    </div>
                    <button className="bot-identity-badge">Configured ✓</button>
                  </div>
                </div>

                {/* 4.3: Dense Cluster of Micro Squares (Badge / Icon matrix from diagram) */}
                <div className="mosaic-cell cell-lower-dense-matrix">
                  <div className="cell-tag tag-top">TOKENS</div>
                  <div className="dense-matrix-grid">
                    {['#0F172A', '#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#14B8A6', '#64748B', '#F1F5F9', '#FFFFFF'].map((color, idx) => (
                      <div
                        key={idx}
                        className="color-token-tile"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                {/* 4.4: Lower Right Columns & Squares */}
                <div className="mosaic-cell cell-lower-right-strip">
                  <div className="cell-tag tag-top">LOADER</div>
                  <div className="bouncing-dots-loader">
                    <span className="b-dot dot-1" />
                    <span className="b-dot dot-2" />
                    <span className="b-dot dot-3" />
                  </div>
                </div>

                {/* ----------------- ROW 5: CONTINUOUS BOTTOM STRIP ----------------- */}
                <div className="mosaic-cell cell-bottom-full-strip">
                  <div className="bottom-tokens-row">
                    <span className="bottom-tag-pill">Accordion</span>
                    <span className="bottom-tag-pill">Alert</span>
                    <span className="bottom-tag-pill">Avatar</span>
                    <span className="bottom-tag-pill">Badge</span>
                    <span className="bottom-tag-pill">Button</span>
                    <span className="bottom-tag-pill">Checkbox</span>
                    <span className="bottom-tag-pill">ConfirmationModal</span>
                    <span className="bottom-tag-pill">DateRangePicker</span>
                    <span className="bottom-tag-pill">DateTimePicker</span>
                    <span className="bottom-tag-pill">DropdownMenu</span>
                    <span className="bottom-tag-pill">Skeleton</span>
                    <span className="bottom-tag-pill">Switch</span>
                    <span className="bottom-tag-pill">Table</span>
                    <span className="bottom-tag-pill">Tooltip</span>
                    <span className="bottom-tag-pill">ThinkingState</span>
                    <span className="bottom-tag-pill">VoiceBot</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* =========================================================================
              VERSION 2: PANORAMIC DRIFT (Expansive Horizontal Conveyor)
              ========================================================================= */}
          {activeVersion === 'panoramic-drift' && (
            <motion.div
              key="panoramic-version"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.4 }}
              className="mosaic-panoramic-container"
            >
              <div className="panoramic-floating-banner">
                <span className="panoramic-live-dot" />
                <span>Infinite Panoramic Mosaic • Glides automatically, pauses on hover</span>
              </div>

              <div className="panoramic-conveyor-belt">
                <div className="conveyor-track">
                  {/* Repeated Mosaic Block Set A */}
                  <div className="conveyor-set">
                    {/* Card */}
                    <div className="conveyor-block card-unit">
                      <div className="cell-tag tag-top">CARD</div>
                      <div className="conveyor-card-body">
                        <span className="text-xs text-slate-500 font-medium">Collected Payment</span>
                        <div className="flex justify-between items-baseline">
                          <span className="text-2xl font-bold text-slate-900">₹32k</span>
                          <span className="text-xs text-emerald-600 font-semibold">▲ 14%</span>
                        </div>
                        <div className="h-10 my-2">
                          <svg viewBox="0 0 160 40" className="w-full h-full">
                            <path d="M0,35 Q30,30 50,20 T100,15 T160,8" fill="none" stroke="#2563eb" strokeWidth="2.5" />
                          </svg>
                        </div>
                        <span className="text-xs text-slate-600 flex items-center gap-1 font-medium">
                          <CloverIcon className="w-3.5 h-3.5 text-emerald-500" />
                          Deep dive into trends →
                        </span>
                      </div>
                    </div>

                    {/* Button */}
                    <div className="conveyor-block button-unit">
                      <div className="cell-tag tag-bottom">BUTTON</div>
                      <div className="conveyor-btn-caustic">
                        <button onClick={handleInvoiceClick} className="diagram-tactile-btn">
                          {invoiceCreated ? 'Done ✓' : 'Create invoice'}
                        </button>
                      </div>
                    </div>

                    {/* Insights */}
                    <div className="conveyor-block insights-unit">
                      <div className="cell-tag tag-top">INSIGHTS</div>
                      <div className="p-4 flex flex-col justify-between h-full">
                        <div className="flex items-center text-xs font-bold text-emerald-700">
                          <CloverIcon className="w-3.5 h-3.5 mr-1" />
                          RAY INSIGHTS
                        </div>
                        <p className="text-base font-bold text-emerald-600 leading-tight">
                          Payment has gone up by 12% <span className="text-slate-900">since last month</span>
                        </p>
                      </div>
                    </div>

                    {/* Audio Player */}
                    <div className="conveyor-block audio-unit">
                      <div className="cell-tag tag-top">AUDIO MEDIA</div>
                      <div className="p-4 flex flex-col justify-center gap-2 h-full">
                        <div className="flex items-center gap-2">
                          <Volume2 className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-bold text-slate-800">Recording Playback</span>
                        </div>
                        <div className="flex items-center gap-1.5 h-6">
                          {[30, 80, 45, 95, 60, 30, 75, 90, 40].map((h, i) => (
                            <div key={i} className="w-1 bg-blue-500 rounded" style={{ height: `${h}%` }} />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Skeleton */}
                    <div className="conveyor-block skeleton-unit">
                      <div className="cell-tag tag-bottom">SKELETON</div>
                      <div className="p-4 flex flex-col gap-2 h-full">
                        <div className="skeleton-line-xs shimmer-fx" />
                        <div className="skeleton-line-sm shimmer-fx" />
                        <div className="skeleton-box-large shimmer-fx" />
                      </div>
                    </div>

                    {/* Thinking */}
                    <div className="conveyor-block thinking-unit">
                      <div className="cell-tag tag-top">THINKING</div>
                      <div className="p-4 flex flex-col justify-center gap-2 h-full">
                        <span className="text-xs font-bold text-emerald-600 flex items-center">
                          <CloverIcon className="w-3.5 h-3.5 mr-1 animate-pulse" />
                          Initiating Onboarding...
                        </span>
                        <div className="flex gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          <span className="w-2 h-2 rounded-full bg-slate-300" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Repeated Mosaic Block Set B (for seamless infinite loop) */}
                  <div className="conveyor-set">
                    {/* Card */}
                    <div className="conveyor-block card-unit">
                      <div className="cell-tag tag-top">CARD</div>
                      <div className="conveyor-card-body">
                        <span className="text-xs text-slate-500 font-medium">Collected Payment</span>
                        <div className="flex justify-between items-baseline">
                          <span className="text-2xl font-bold text-slate-900">₹32k</span>
                          <span className="text-xs text-emerald-600 font-semibold">▲ 14%</span>
                        </div>
                        <div className="h-10 my-2">
                          <svg viewBox="0 0 160 40" className="w-full h-full">
                            <path d="M0,35 Q30,30 50,20 T100,15 T160,8" fill="none" stroke="#2563eb" strokeWidth="2.5" />
                          </svg>
                        </div>
                        <span className="text-xs text-slate-600 flex items-center gap-1 font-medium">
                          <CloverIcon className="w-3.5 h-3.5 text-emerald-500" />
                          Deep dive into trends →
                        </span>
                      </div>
                    </div>

                    {/* Button */}
                    <div className="conveyor-block button-unit">
                      <div className="cell-tag tag-bottom">BUTTON</div>
                      <div className="conveyor-btn-caustic">
                        <button onClick={handleInvoiceClick} className="diagram-tactile-btn">
                          {invoiceCreated ? 'Done ✓' : 'Create invoice'}
                        </button>
                      </div>
                    </div>

                    {/* Insights */}
                    <div className="conveyor-block insights-unit">
                      <div className="cell-tag tag-top">INSIGHTS</div>
                      <div className="p-4 flex flex-col justify-between h-full">
                        <div className="flex items-center text-xs font-bold text-emerald-700">
                          <CloverIcon className="w-3.5 h-3.5 mr-1" />
                          RAY INSIGHTS
                        </div>
                        <p className="text-base font-bold text-emerald-600 leading-tight">
                          Payment has gone up by 12% <span className="text-slate-900">since last month</span>
                        </p>
                      </div>
                    </div>

                    {/* Audio Player */}
                    <div className="conveyor-block audio-unit">
                      <div className="cell-tag tag-top">AUDIO MEDIA</div>
                      <div className="p-4 flex flex-col justify-center gap-2 h-full">
                        <div className="flex items-center gap-2">
                          <Volume2 className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-bold text-slate-800">Recording Playback</span>
                        </div>
                        <div className="flex items-center gap-1.5 h-6">
                          {[30, 80, 45, 95, 60, 30, 75, 90, 40].map((h, i) => (
                            <div key={i} className="w-1 bg-blue-500 rounded" style={{ height: `${h}%` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* =========================================================================
              VERSION 3: OPTICAL CAUSTICS (Luminous Dark Mode & Glow Borders)
              ========================================================================= */}
          {activeVersion === 'dark-caustics' && (
            <motion.div
              key="caustics-version"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4 }}
              className="mosaic-dark-canvas"
            >
              <div className="dark-caustics-ambient-glow" />
              <div className="mosaic-grid-container dark-mode-grid">
                {/* Dark Hero Card */}
                <div className="mosaic-cell cell-card-large-hero dark-cell">
                  <div className="cell-tag tag-top dark-tag">CARD</div>
                  <div className="dark-card-inner">
                    <span className="text-xs text-slate-400">Collected Payment</span>
                    <div className="flex justify-between items-baseline my-1">
                      <span className="text-3xl font-bold text-white tracking-tight">₹32k</span>
                      <span className="text-xs text-emerald-400 font-semibold">▲ 14%</span>
                    </div>
                    <div className="h-20 my-2">
                      <svg viewBox="0 0 240 60" className="w-full h-full">
                        <defs>
                          <linearGradient id="darkSpark" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path d="M0,50 Q40,40 70,30 T140,20 T240,10 L240,60 L0,60 Z" fill="url(#darkSpark)" />
                        <path d="M0,50 Q40,40 70,30 T140,20 T240,10" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                        <circle cx="240" cy="10" r="4" fill="#38bdf8" />
                      </svg>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <CloverIcon className="w-3.5 h-3.5 text-emerald-400" />
                        Deep dive into trends
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                  </div>
                </div>

                {/* Dark Button */}
                <div className="mosaic-cell cell-button-caustic-block dark-cell">
                  <div className="cell-tag tag-top dark-tag">BUTTON</div>
                  <div className="dark-button-caustic">
                    <button onClick={handleInvoiceClick} className="dark-glow-btn">
                      {invoiceCreated ? 'Created ✓' : 'Create invoice'}
                    </button>
                  </div>
                </div>

                {/* Dark Insights */}
                <div className="mosaic-cell cell-insights-hero dark-cell">
                  <div className="cell-tag tag-top dark-tag">INSIGHTS</div>
                  <div className="p-6 flex flex-col justify-between h-full">
                    <div className="flex items-center text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      <CloverIcon className="w-4 h-4 mr-2" />
                      RAY INTELLIGENCE
                    </div>
                    <p className="text-xl font-bold leading-snug">
                      <span className="text-emerald-400">Payment has gone up by 12%</span>{' '}
                      <span className="text-slate-300">since last month</span>
                    </p>
                  </div>
                </div>

                {/* Dark Skeleton */}
                <div className="mosaic-cell cell-skeleton-hero dark-cell">
                  <div className="cell-tag tag-bottom dark-tag">SKELETON LOADER</div>
                  <div className="p-5 flex flex-col gap-3 h-full">
                    <div className="skeleton-line-xs dark-shimmer" />
                    <div className="skeleton-line-sm dark-shimmer" />
                    <div className="skeleton-box-large dark-shimmer" />
                    <div className="skeleton-row-duo">
                      <div className="skeleton-box-half dark-shimmer" />
                      <div className="skeleton-box-half dark-shimmer" />
                    </div>
                  </div>
                </div>

                {/* Dark Thinking */}
                <div className="mosaic-cell cell-thinking-large-hero dark-cell">
                  <div className="cell-tag tag-top dark-tag">THINKING STATE</div>
                  <div className="p-5 flex flex-col justify-between h-full">
                    <div className="flex items-center text-xs font-bold text-emerald-400">
                      <CloverIcon className="w-4 h-4 mr-2 animate-spin" />
                      Neural Handover Initializing...
                    </div>
                    <div className="space-y-3 my-2">
                      <div className="flex items-center gap-2 text-xs text-slate-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Calibrated Voice Pipeline</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-amber-300">
                        <Sparkles className="w-3.5 h-3.5 animate-spin" />
                        <span>Fine-tuning Persona Prompts</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-700 inline-block" />
                        <span>Connecting Webhooks</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* =========================================================================
              VERSION 4: INTERACTIVE LAB (Live State Triggers & Sandbox)
              ========================================================================= */}
          {activeVersion === 'interactive-lab' && (
            <motion.div
              key="lab-version"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
              className="mosaic-lab-container"
            >
              {/* Controls Toolbar */}
              <div className="lab-control-deck">
                <div className="control-deck-group">
                  <span className="control-label">Live Simulation:</span>
                  <button
                    onClick={() => setGlobalShimmer(!globalShimmer)}
                    className={`lab-pill-btn ${globalShimmer ? 'active' : ''}`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${globalShimmer ? 'animate-spin' : ''}`} />
                    <span>{globalShimmer ? 'Shimmer Active' : 'Shimmer Paused'}</span>
                  </button>
                  <button
                    onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                    className={`lab-pill-btn ${isPlayingAudio ? 'active' : ''}`}
                  >
                    <Volume2 className="w-3.5 h-3.5 mr-1.5" />
                    <span>{isPlayingAudio ? 'Mute Audio Track' : 'Play Audio Track'}</span>
                  </button>
                </div>
                <div className="control-deck-group">
                  <span className="control-label">Step Index:</span>
                  {[1, 2, 3].map((step) => (
                    <button
                      key={step}
                      onClick={() => setActiveStep(step)}
                      className={`lab-step-num-btn ${activeStep === step ? 'active' : ''}`}
                    >
                      Step {step}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lab Mosaic Canvas */}
              <div className="mosaic-grid-container lab-grid">
                {/* Card */}
                <div className="mosaic-cell cell-card-large-hero">
                  <div className="cell-tag tag-top">CARD</div>
                  <div className="card-large-hero-inner">
                    <span className="card-subtitle-text">Collected Payment</span>
                    <div className="card-figure-row">
                      <span className="card-figure-bold">₹32,480</span>
                      <span className="card-trend-badge">▲ 14.8%</span>
                    </div>
                    <div className="card-sparkline-area">
                      <svg viewBox="0 0 240 70" className="w-full h-full" preserveAspectRatio="none">
                        <path d="M0,55 Q40,45 80,35 T160,20 T240,12" fill="none" stroke="#2563eb" strokeWidth="3" />
                      </svg>
                    </div>
                    <div className="card-bottom-row">
                      <span className="text-xs font-semibold text-slate-700">Live Telemetry Hooked</span>
                      <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                  </div>
                </div>

                {/* Button */}
                <div className="mosaic-cell cell-button-caustic-block">
                  <div className="cell-tag tag-top">BUTTON</div>
                  <div className="button-caustic-canvas">
                    <button onClick={handleInvoiceClick} className="diagram-tactile-btn">
                      {invoiceCreated ? 'Triggered!' : 'Click to Trigger'}
                    </button>
                  </div>
                </div>

                {/* Insights */}
                <div className="mosaic-cell cell-insights-hero">
                  <div className="cell-tag tag-top">INSIGHTS</div>
                  <div className="insights-diagram-body">
                    <div className="insights-diagram-header">
                      <CloverIcon className="w-4 h-4 text-emerald-600 mr-2" />
                      <span className="insights-diagram-brand">RAY INSIGHTS</span>
                    </div>
                    <p className="insights-diagram-text">
                      <span className="insights-bold-green">Payment has gone up by 12%</span>{' '}
                      <span className="insights-dark-slate">since last month</span>
                    </p>
                  </div>
                </div>

                {/* Skeleton */}
                <div className="mosaic-cell cell-skeleton-hero">
                  <div className="cell-tag tag-bottom">SKELETON</div>
                  <div className="skeleton-diagram-layout">
                    <div className={`skeleton-line-xs ${globalShimmer ? 'shimmer-fx' : ''}`} />
                    <div className={`skeleton-line-sm ${globalShimmer ? 'shimmer-fx' : ''}`} />
                    <div className={`skeleton-box-large ${globalShimmer ? 'shimmer-fx' : ''}`} />
                  </div>
                </div>

                {/* Thinking */}
                <div className="mosaic-cell cell-thinking-large-hero">
                  <div className="cell-tag tag-top">THINKING STATE</div>
                  <div className="thinking-diagram-inner">
                    <div className="thinking-diagram-top">
                      <CloverIcon className="w-4 h-4 text-emerald-500 animate-spin mr-2" />
                      <span className="thinking-top-title">Step {activeStep} of 3</span>
                    </div>
                    <div className="thinking-timeline">
                      <div className="timeline-spine" />
                      <div className={`timeline-step ${activeStep >= 1 ? 'done' : ''}`}>
                        <div className="step-disc">✓</div>
                        <span className="step-name">Team setup</span>
                      </div>
                      <div className={`timeline-step ${activeStep >= 2 ? 'active' : ''}`}>
                        <div className="step-disc">⚡</div>
                        <span className="step-name">Persona generated</span>
                      </div>
                      <div className={`timeline-step ${activeStep >= 3 ? 'active' : ''}`}>
                        <div className="step-disc">○</div>
                        <span className="step-name">Tokens linked</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Token Drawer */}
      <footer className="mosaic-footer-drawer">
        <div className="mosaic-footer-inner">
          <div className="footer-token-info">
            <h4 className="footer-title">Tessellated Grid Architecture</h4>
            <p className="footer-desc">
              All partitioned cells dynamically scale to showcase components from the MyOperator Storybook design system.
            </p>
          </div>
          <div className="footer-actions">
            <a
              href="https://storybook-npm-psi.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-storybook-btn"
            >
              <span>View Component Docs</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
