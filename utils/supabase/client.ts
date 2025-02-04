import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

let supabase: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  if (supabase) return supabase

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key are required')
  }

  supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  return supabase
}

