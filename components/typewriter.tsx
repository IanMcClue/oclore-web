'use client'

import { useState, useEffect, useRef } from 'react'

interface TypewriterProps {
  text: string
  className?: string
  speed?: number
  onComplete?: () => void
}

export function Typewriter({ 
  text, 
  className = '', 
  speed = 30,
  onComplete 
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState('')
  const index = useRef(0)

  useEffect(() => {
    // Reset when text changes
    setDisplayText('')
    index.current = 0
  }, [text])

  useEffect(() => {
    if (!text) return

    const timer = setInterval(() => {
      if (index.current < text.length) {
        setDisplayText(prev => prev + text.charAt(index.current))
        index.current += 1
      } else {
        clearInterval(timer)
        onComplete?.()
      }
    }, speed)

    return () => clearInterval(timer)
  }, [text, speed, onComplete])

  // If no text provided, show loading state
  if (!text) {
    return (
      <div className={className}>
        <div className="animate-pulse">
          Generating your story...
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {displayText}
      <span className="animate-blink">|</span>
    </div>
  )
}

