// functions/generate-future-story/index.ts

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
const openaiApiKey = process.env.OPENAI_API_KEY

// Create clients
const supabase = createClient(supabaseUrl, supabaseKey)
const openai = new OpenAI({ apiKey: openaiApiKey })

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    const record = payload.record

    if (record.status !== 'verified') {
      return NextResponse.json(
        { message: 'Ignored: status not verified' },
        { status: 200 }
      )
    }

    // Get user data
    const { data: { user } } = await supabase.auth.admin.getUserById(record.user_id)
    const userName = user?.user_metadata?.full_name || 
                    user?.user_metadata?.display_name || 
                    'User'

    // Generate story
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a creative writer crafting personalized, inspiring future stories.'
        },
        {
          role: 'user',
          content: `Create a detailed story about ${userName}'s life in ${new Date().getFullYear() + 5}, using these responses: ${JSON.stringify(record.responses)}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const generatedStory = completion.choices[0].message.content

    // Save story and update status
    const { error } = await supabase.rpc('save_story_and_update_status', {
      p_user_id: record.user_id,
      p_story: generatedStory,
    })

    if (error) throw error

    return NextResponse.json({ message: 'Story generated and saved successfully' })
  } catch (error) {
    console.error('Edge Function error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
