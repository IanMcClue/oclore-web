import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    console.log('Starting story generation...')
    const supabase = await createClient()
    const { userId, localResponses } = await request.json()

    // Get user's responses and profile
    const [userResponses, userProfile] = await Promise.all([
      supabase
        .from('user_responses')
        .select('responses, status')
        .eq('user_id', userId)
        .single(),
      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single()
    ])

    // Use local responses if database responses are not available
    const responses = userResponses.data?.responses || localResponses || []
    
    if (!responses || responses.length === 0) {
      throw new Error('No responses available')
    }

    const userName = userProfile.data?.full_name || 'you'
    console.log('Creating story for:', userName)

    // Create the stream with available responses
    const stream = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a creative writer crafting personalized, inspiring future stories.'
        },
        {
          role: 'user',
          content: `Create a detailed story about ${userName}'s life in ${new Date().getFullYear() + 5}, using their questionnaire responses: ${JSON.stringify(responses)}`
        }
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 2000
    })

    console.log('Stream created, starting response...')

    // Create web stream
    const textStream = new ReadableStream({
      async start(controller) {
        let accumulatedStory = ''

        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              accumulatedStory += content
              controller.enqueue(content)
            }
          }

          console.log('Story generation complete')

          // Save complete story
          await supabase
            .from('user_stories')
            .upsert({
              user_id: userId,
              story: accumulatedStory,
              updated_at: new Date().toISOString()
            })

          controller.close()
        } catch (error) {
          console.error('Stream error:', error)
          controller.error(error)
        }
      }
    })

    return new Response(textStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Story generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate story' }, 
      { status: 500 }
    )
  }
}

