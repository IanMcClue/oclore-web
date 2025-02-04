'use client'

import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

const emojis = ['💧', '📚', '🍎', '🏋️‍♂️', '🧘‍♀️', '💻', '🎨', '🎵', '🌱', '🧹']

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
}

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [selectedEmoji, setSelectedEmoji] = useState('💧')

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji)
    onEmojiSelect(emoji)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <span className="mr-2">{selectedEmoji}</span>
          <span>Select Emoji</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="grid grid-cols-5 gap-2">
          {emojis.map((emoji) => (
            <button
              key={emoji}
              className="text-2xl hover:bg-gray-100 rounded p-2"
              onClick={() => handleEmojiSelect(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

