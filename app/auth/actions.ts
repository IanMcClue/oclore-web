'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { LocalStorage } from '@/utils/session'

const siteUrl = process.env.NODE_ENV === 'production' 
  ? process.env.SITE_URL 
  : 'http://localhost:3000'

export async function login(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Set cookie using async pattern
  if (data.user) {
    await Promise.resolve(cookieStore.set('user_id', data.user.id, { 
      maxAge: 3600,
      path: '/' 
    }))
  }

  return { success: true }
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string
  const responsesJson = formData.get('stored_responses') as string

  // Create user first
  const { data: { user }, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/confirm`,
      data: {
        display_name: name,
        full_name: name
      }
    }
  })

  if (signUpError || !user) {
    return { error: signUpError?.message || 'Failed to create user' }
  }

  try {
    const storedData = responsesJson ? JSON.parse(responsesJson) : null
    
    if (storedData) {
      console.log('Storing responses for user:', user.id)
      
      // Insert responses with all required fields
      const { error: insertError } = await supabase
        .from('user_responses')
        .insert({
          user_id: user.id,
          name: name, // Add the name field
          responses: storedData.responses,
          status: 'pending',
          created_at: storedData.timestamp,
          updated_at: new Date().toISOString()
        })

      if (insertError) {
        console.error('Error storing responses:', insertError)
        // Don't return error - allow signup to continue
      }
    }

    return { 
      success: true,
      message: 'Please check your email to confirm your account.'
    }
  } catch (error) {
    console.error('Error processing responses:', error)
    return { success: true, message: 'Account created, but responses not saved.' }
  }
}

