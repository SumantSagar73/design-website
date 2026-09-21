import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { motion, type Variants } from 'framer-motion'

export type SplitTextProps = {
  text: string
  className?: string
  delay?: number
  duration?: number
  splitType?: 'words' | 'chars'
  tag?: 'h1' | 'h2' | 'h3' | 'p' | 'div'
  textAlign?: CSSProperties['textAlign']
  onLetterAnimationComplete?: () => void
  style?: CSSProperties
}

export default function SplitText({
  text,
  className = '',
  delay = 40,
  duration = 0.8,
  splitType = 'words',
  textAlign = 'left',
  style,
}: SplitTextProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.unobserve(ref.current as Element)
        }
      },
      { threshold: 0.15, rootMargin: '-40px' },
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const items = splitType === 'words' ? text.split(' ') : text.split('')

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: delay / 1000,
        delayChildren: 0.1,
      },
    },
  }

  const child: Variants = {
    hidden: {
      opacity: 0,
      y: 35,
      filter: 'blur(8px)',
    },
    show: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  }

  return (
    <motion.div
      ref={ref}
      className={`split-text-wrap ${className}`}
      variants={container}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        textAlign,
        ...style,
      }}
    >
      {items.map((item, idx) => (
        <span
          key={idx}
          style={{
            display: 'inline-block',
            overflow: 'hidden',
            marginRight: splitType === 'words' ? '0.24em' : '0',
            verticalAlign: 'baseline',
          }}
        >
          <motion.span
            variants={child}
            style={{
              display: 'inline-block',
              willChange: 'transform, opacity, filter',
            }}
          >
            {item}
          </motion.span>
        </span>
      ))}
    </motion.div>
  )
}
