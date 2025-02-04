'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import confetti from 'canvas-confetti'
import Fireworks from 'react-canvas-confetti/dist/presets/fireworks'

interface ProgressRingProps {
  progress: number
  avatarSrc: string
  avatarFallback: string
}

export function ProgressRing({ progress, avatarSrc, avatarFallback }: ProgressRingProps) {
  const [currentProgress, setCurrentProgress] = useState(progress)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [showFireworks, setShowFireworks] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const prevProgressRef = useRef(progress)

  useEffect(() => {
    setCurrentProgress(progress)
    if (progress === 100 && prevProgressRef.current !== 100) {
      celebrateCompletion()
    }
    prevProgressRef.current = progress
  }, [progress])

  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (currentProgress / 100) * circumference

  const celebrateCompletion = useCallback(() => {
    setShowFireworks(true)
    
    const duration = 5 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval: NodeJS.Timeout = setInterval(function() {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        setShowFireworks(false)
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)
      
      // Run confetti from the left edge
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: 0, y: 1 } }))
      // Run confetti from the right edge
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: 1, y: 1 } }))
      // Run confetti from the center
      confetti(Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 }
      }))
    }, 250)

  }, [])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      <svg
        className="w-full h-full -rotate-90"
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#f3ddd9"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#e7bab2"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <Avatar 
          className="w-32 h-32 rounded-full border-4 border-white shadow-md cursor-pointer"
          onClick={handleAvatarClick}
        >
          <AvatarImage src={uploadedImage || avatarSrc} alt="User avatar" />
          <AvatarFallback className="text-sm text-center">
            {avatarFallback}
          </AvatarFallback>
        </Avatar>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
        />
      </div>
      {showFireworks && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <Fireworks autorun={{ speed: 3 }} />
        </div>
      )}
    </div>
  )
}

