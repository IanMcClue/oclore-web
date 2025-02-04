'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import confetti from 'canvas-confetti'

interface ScratchPostProps {
  content: string
  routine: string
  pattern: number
}

const overlayImages = [
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/d1036211-3a96-46eb-bdf2-9ec0170bd058.jpg-1nDfOIGmmVohca5MUG03GsBp8y4iLB.jpeg',
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/afirmações _ glow up_ it girl _ new era _ nova era….jpg-HFhmEwgexPhXZHiCnuomlq86NYPnxW.jpeg',
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Pink heart aura wallpaper manifestation for vision board.jpg-YalsdOYsnQZFlPRXD9knOgv6M6xUmq.jpeg',
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/toast-dSfOh2gAZDogTZwTiScyeP3PQjZqLR.jpeg',
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG_1196-iFQ5CE4RSzYvPN6YIIwxWE3YZdYEeE.jpeg'
]

export function ScratchPostPatterned({ content, routine, pattern }: ScratchPostProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isRevealed, setIsRevealed] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)
  const overlayImage = overlayImages[pattern % overlayImages.length]
  const scaleFactor = pattern === 4 ? 2 : 1

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const image = new Image()
    image.crossOrigin = "anonymous"
    image.src = overlayImages[pattern % overlayImages.length]

    const resizeCanvas = () => {
      const parent = canvas.parentElement
      if (!parent) return

      canvas.width = parent.clientWidth * scaleFactor
      canvas.height = parent.clientHeight * scaleFactor
      canvas.style.width = `${parent.clientWidth}px`
      canvas.style.height = `${parent.clientHeight}px`

      if (image.complete) {
        drawBackground()
      }
    }

    const drawBackground = () => {
      if (!ctx || !canvas) return

      // Draw base color
      ctx.fillStyle = '#e7bab2'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw overlay pattern
      const scale = Math.max(
        canvas.width / image.width,
        canvas.height / image.height
      )
      
      const x = (canvas.width - image.width * scale) / 2
      const y = (canvas.height - image.height * scale) / 2

      // Set different opacity based on pattern number
      if (pattern === 3 || pattern === 4) {
        ctx.globalAlpha = 1.0  // No opacity effect for patterns 3 and 4
      } else {
        ctx.globalAlpha = 0.3  // Keep existing opacity for patterns 0-2
      }

      ctx.save()
      ctx.scale(scale, scale)
      ctx.drawImage(
        image,
        x / scale,
        y / scale,
        image.width,
        image.height
      )
      ctx.restore()
      ctx.globalAlpha = 1.0

      // Add scratch text
      ctx.font = 'bold 24px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = 'white'
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      ctx.shadowBlur = 4
      ctx.fillText('Scratch to reveal', canvas.width / 2, canvas.height / 2)
    }

    image.onload = resizeCanvas
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    return () => window.removeEventListener('resize', resizeCanvas)
  }, [overlayImage, pattern, scaleFactor])

  const handleStart = (x: number, y: number) => {
    setIsDrawing(true)
    lastPoint.current = { 
      x: x * scaleFactor, 
      y: y * scaleFactor 
    }
  }

  const handleMove = (x: number, y: number) => {
    if (!isDrawing || !canvasRef.current || !lastPoint.current) return

    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.lineWidth = 50 * scaleFactor
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y)
    ctx.lineTo(x * scaleFactor, y * scaleFactor)
    ctx.stroke()

    lastPoint.current = { 
      x: x * scaleFactor, 
      y: y * scaleFactor 
    }

    // Check percentage revealed
    const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
    const pixels = imageData.data
    let transparentPixels = 0

    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] < 50) transparentPixels++ // Made threshold more lenient
    }

    const percentRevealed = (transparentPixels / (pixels.length / 4)) * 100
    if (percentRevealed > 30 && !isRevealed) { // Reduced threshold from 50 to 30
      setIsRevealed(true)
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
    }
  }

  const handleEnd = () => {
    setIsDrawing(false)
    lastPoint.current = null
  }

  return (
    <Card className="relative w-full h-full overflow-hidden bg-gradient-to-br from-[#f9eeec] to-[#e7bab2]">
      <CardContent className="p-0 h-full flex items-center justify-center">
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="text-center space-y-4 max-w-md">
            <h3 className="text-2xl font-bold text-foreground">{content}</h3>
            {routine && (
              <p className="text-lg text-muted-foreground">{routine}</p>
            )}
          </div>
        </div>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 touch-none cursor-pointer z-30"
          style={{ 
            opacity: isRevealed ? 0.2 : 1, 
            transition: 'opacity 0.5s ease',
            touchAction: 'none' 
          }}
          onMouseDown={(e) => {
            const rect = canvasRef.current?.getBoundingClientRect()
            if (!rect) return
            handleStart(e.clientX - rect.left, e.clientY - rect.top)
          }}
          onMouseMove={(e) => {
            const rect = canvasRef.current?.getBoundingClientRect()
            if (!rect) return
            handleMove(e.clientX - rect.left, e.clientY - rect.top)
          }}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={(e) => {
            e.preventDefault()
            const touch = e.touches[0]
            const rect = canvasRef.current?.getBoundingClientRect()
            if (!rect) return
            handleStart(touch.clientX - rect.left, touch.clientY - rect.top)
          }}
          onTouchMove={(e) => {
            e.preventDefault()
            const touch = e.touches[0]
            const rect = canvasRef.current?.getBoundingClientRect()
            if (!rect) return
            handleMove(touch.clientX - rect.left, touch.clientY - rect.top)
          }}
          onTouchEnd={handleEnd}
        />
      </CardContent>
    </Card>
  )
}

