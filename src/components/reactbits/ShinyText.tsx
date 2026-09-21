import type { CSSProperties, ReactNode } from 'react'

export type ShinyTextProps = {
  text: string
  className?: string
  color?: string
  shineColor?: string
  speed?: number
  spread?: number
  children?: ReactNode
}

export default function ShinyText({
  text,
  className = '',
  color = '#0b0e18',
  shineColor = '#7f9eff',
  speed = 4.5,
  spread = 120,
}: ShinyTextProps) {
  const gradientStyle: CSSProperties = {
    backgroundImage: `linear-gradient(${spread}deg, ${color} 0%, ${color} 38%, ${shineColor} 50%, ${color} 62%, ${color} 100%)`,
    backgroundSize: '200% auto',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    display: 'inline',
    animation: `shineText ${speed}s linear infinite`,
  }

  return (
    <span className={`reactbits-shiny-text ${className}`} style={gradientStyle}>
      {text}
    </span>
  )
}
