import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  const token_hash = searchParams.get('token_hash')
  const code = searchParams.get('code')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = '/future-story'
  
  const response = NextResponse.redirect(new URL(next, request.url))
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.delete(name)
        },
      },
    }
  )

  try {
    let verifyResult;
    
    if (code) {
      verifyResult = await supabase.auth.exchangeCodeForSession(code)
    } else if (token_hash && type) {
      verifyResult = await supabase.auth.verifyOtp({
        type,
        token_hash,
      })
    } else {
      throw new Error('Invalid confirmation parameters')
    }

    const { data: { user, session }, error } = verifyResult

    if (error) throw error

    if (user) {
      try {
        // First check if user_responses exists for this user
        const { data: existingResponses, error: checkError } = await supabase
          .from('user_responses')
          .select('id, status, responses, session_id')
          .eq('user_id', user.id)
          .single()

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking responses:', checkError)
        }

        if (!existingResponses) {
          // If no responses exist, check for responses with a session_id
          const sessionId = request.cookies.get('session_id')?.value
          if (sessionId) {
            // Migrate responses from session_id to user_id
            const { data: anonymousResponses, error: migrateError } = await supabase
              .from('user_responses')
              .select('id, responses, session_id')
              .eq('session_id', sessionId)
              .is('user_id', null) // Only target anonymous responses
              .single()

            if (migrateError && migrateError.code !== 'PGRST116') {
              console.error('Error migrating responses:', migrateError)
            }

            if (anonymousResponses) {
              // Update the response with the user's ID
              const { error: updateError } = await supabase
                .from('user_responses')
                .update({
                  user_id: user.id,
                  status: 'verified',
                  updated_at: new Date().toISOString()
                })
                .eq('id', anonymousResponses.id)

              if (updateError) {
                console.error('Error updating response:', updateError)
              } else {
                console.log('Successfully migrated responses for user:', user.id)
              }
            }
          } else {
            console.log('No existing responses found for user:', user.id)
          }
        } else if (existingResponses.status !== 'verified') {
          // Update status to verified
          const { error: updateError } = await supabase
            .from('user_responses')
            .update({ 
              status: 'verified',
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)

          if (updateError) {
            console.error('Error updating response status:', updateError)
          }
        }

        return response
      } catch (error) {
        console.error('Error in confirmation flow:', error)
        return response
      }
    }
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent(error instanceof Error ? error.message : 'Verification failed')}`, request.url)
    )
  }

  return NextResponse.redirect(
    new URL('/auth?error=Invalid confirmation link', request.url)
  )
}