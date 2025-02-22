'use client'

import { Trash2Icon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckmarkComplete } from './CheckmarkComplete'

interface TaskItemProps {
  id: number
  title: string
  amount: string
  time: string
  icon: string
  progress: number
  onProgress: () => void
  onDelete: () => void
}

const getColorForEmoji = (emoji: string) => {
  switch (emoji) {
    case '💧': return '#a8e6ff'
    case '📚': return '#ffd700'
    case '🥦': return '#90EE90'
    case '🏋️‍♂️': return '#ff7f50'
    case '🧘‍♀️': return '#dda0dd'
    case '💻': return '#20b2aa'
    case '🎨': return '#ff69b4'
    case '🎵': return '#9370db'
    case '🌱': return '#98fb98'
    case '🧹': return '#d3d3d3'
    case '🍎': return '#ff0000'
    case '🍊': return '#ffa500'
    case '🍋': return '#ffff00'
    case '🍇': return '#800080'
    case '🫐': return '#0000ff'
    default: return '#e7bab2'
  }
}

export function TaskItem({ id, title, amount, time, icon, progress, onProgress, onDelete }: TaskItemProps) {
  const [isPressed, setIsPressed] = useState(false)
  const [showGlowAnimation, setShowGlowAnimation] = useState(false)
  const backgroundColor = getColorForEmoji(icon)

  useEffect(() => {
    if (isPressed) {
      const timer = setTimeout(() => setIsPressed(false), 200)
      return () => clearTimeout(timer)
    }
  }, [isPressed])

  useEffect(() => {
    if (progress === 100) {
      setShowGlowAnimation(true)
      const timer = setTimeout(() => setShowGlowAnimation(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [progress])

  return (
    <div 
      className="relative flex items-center gap-2 w-[calc(100%-8px)] mx-auto p-3 rounded-xl transition-all duration-300 cursor-pointer transform overflow-hidden"
      style={{
        background: 'linear-gradient(to bottom, #e7bab2, #f9eeec)',
        transform: isPressed ? 'scale(0.98)' : 'scale(1)',
      }}
      onClick={() => {
        setIsPressed(true)
        onProgress()
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          setIsPressed(true)
          onProgress()
        }
      }}
      aria-label={`Update progress for ${title}. Current progress: ${progress}%`}
    >
      {/* Progress overlay */}
      <div 
        className="absolute inset-0 transition-all duration-300"
        style={{
          background: backgroundColor,
          width: `${progress}%`,
          opacity: 0.3,
        }}
      />

      <div className="relative w-12 h-12 flex-shrink-0 z-10">
        <svg className="w-full h-full">
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="#e0e0e0"
            strokeWidth="4"
          />
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="#f6e5e1"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="125.6"
            strokeDashoffset={125.6 - (125.6 * progress) / 100}
          />
        </svg>
        <AnimatePresence mode="wait">
          {progress === 100 ? (
            <motion.div
              key="checkmark"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: [1, 1.2, 1] }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.5 }}
              className={`absolute inset-0 flex items-center justify-center text-pink-500 ${showGlowAnimation ? 'animate-glow' : ''}`}
            >
              <CheckmarkComplete />
            </motion.div>
          ) : (
            <motion.div
              key="icon"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute inset-0 flex items-center justify-center text-2xl"
            >
              {icon}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 z-10">
        <div className="font-medium">
          {title}
        </div>
        <div className="text-sm opacity-70">
          {amount}
        </div>
      </div>

      <div className="text-sm opacity-70 min-w-[65px] text-right z-10">
        {time}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className="flex-shrink-0 z-10"
        aria-label={`Delete ${title} task`}
      >
        <Trash2Icon className="h-4 w-4" />
      </Button>
    </div>
  )
}