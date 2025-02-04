'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Database } from '@/types/supabase'
import { User } from '@supabase/supabase-js'

type SupabaseContext = {
  supabase: ReturnType<typeof createClientComponentClient<Database>>
  user: User | null
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export default function SupabaseProvider({ 
  children,
  initialUser
}: { 
  children: React.ReactNode
  initialUser: User | null
}) {
  const [supabaseClient] = useState(() => createClientComponentClient<Database>())
  const [user, setUser] = useState<User | null>(initialUser)
  const router = useRouter()

  // Add caching for auth state
  const [authCache, setAuthCache] = useState<{[key: string]: any}>({})

  useEffect(() => {
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        // Always verify user with getUser
        const { data: { user }, error } = await supabaseClient.auth.getUser()
        if (!error && user) {
          setUser(user)
        } else {
          setUser(null)
        }
      } else {
        setUser(null)
      }
      router.refresh()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabaseClient, router])

  return (
    <Context.Provider value={{ 
      supabase: supabaseClient, 
      user
    }}>
      {children}
    </Context.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useSupabase must be used inside SupabaseProvider')
  }
  return context
}

