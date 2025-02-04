import { useState, useEffect } from 'react'

export function useStoryStream(userId: string, initialStory: string) {
  const [story, setStory] = useState(initialStory)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    
    // Only start streaming if we're in the generating state
    if (initialStory !== 'Generating your story...') {
      console.log('Not in generating state:', initialStory)
      return
    }

    console.log('Starting stream fetch for user:', userId)
    
    const fetchStream = async () => {
      setIsStreaming(true)
      try {
        // Get responses from localStorage
        const localResponses = JSON.parse(localStorage.getItem('userResponses') || '[]')

        const response = await fetch('/api/generate-future-story', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId,
            localResponses 
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to generate story: ${response.statusText}`)
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error('No reader available')

        const decoder = new TextDecoder()
        let accumulatedStory = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          accumulatedStory += chunk
          setStory(accumulatedStory)
        }

        console.log('Stream complete')
      } catch (error) {
        console.error('Stream error:', error)
        setError(error instanceof Error ? error.message : 'Unknown error')
      } finally {
        setIsStreaming(false)
      }
    }

    fetchStream()
  }, [userId, initialStory])

  return { story, isStreaming, error }
}
