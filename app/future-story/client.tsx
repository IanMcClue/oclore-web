'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { Typewriter } from '@/components/typewriter'
import { LocalStorage } from '@/utils/session'
import { useStoryStream } from '../hooks/useStoryStream'

interface FutureStoryClientProps {
  user: User
  name: string
  initialStory: string
  status: 'pending' | 'verified' | 'story-generated' | 'error'
  isGenerating: boolean
  lastUpdated: string | null
}

export default function FutureStoryClient({ 
  user, 
  name, 
  initialStory, 
  status,
  isGenerating,
  lastUpdated 
}: FutureStoryClientProps) {
  const { story, isStreaming, error } = useStoryStream(user.id, initialStory)
  const [displayStory, setDisplayStory] = useState(initialStory)

  useEffect(() => {
    if (status === 'story-generated') {
      LocalStorage.clear()
    }

    if (error) {
      console.error('Story generation error:', error)
      return
    }

    if (isStreaming) {
      setDisplayStory(story)
    } else if (!isStreaming && story) {
      setDisplayStory(story)
    } else if (!story && isGenerating) {
      setDisplayStory(`Welcome, ${name}! Your personalized future story is being generated...`)
    }
  }, [story, name, status, isGenerating, isStreaming, error])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f9eeec] to-[#e7bab2] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Your Future Story, {name}</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          {(isGenerating || isStreaming) ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
              <p className="text-center text-gray-600">
                {displayStory}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Typewriter text={displayStory} className="text-lg leading-relaxed" />
              {lastUpdated && (
                <p className="text-sm text-gray-500 text-right">
                  Last updated: {new Date(lastUpdated).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>

        {(status === 'error' || error) && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error || 'There was an error generating your story. Please try again later.'}
          </div>
        )}
      </div>
    </div>
  )
}

