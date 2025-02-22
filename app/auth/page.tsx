'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { login, signup } from './actions'
import { useSupabase } from '../supabase-provider'
import { LocalStorage } from '@/utils/session'

export default function Auth() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedTab, setSelectedTab] = useState('login')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { supabase } = useSupabase()

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'login' || tab === 'signup') {
      setSelectedTab(tab)
    }
  }, [searchParams])

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event)
      
      if (event === 'SIGNED_IN' && session) {
        // Only redirect if email is confirmed
        if (session.user.email_confirmed_at) {
          const redirectTo = searchParams.get('redirectTo') || '/fyp'
          router.push(redirectTo)
        } else {
          setMessage('Please check your email to verify your account before continuing.')
          setSelectedTab('login')
        }
      } else if (event === 'USER_UPDATED' && session?.user.email_confirmed_at) {
        // Handle email verification completion
        const redirectTo = searchParams.get('redirectTo') || '/fyp'
        router.push(redirectTo)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router, searchParams])

  useEffect(() => {
    // Get display_name from URL params
    const displayName = searchParams.get('display_name')
    if (displayName) {
      setName(decodeURIComponent(displayName))
    }
  }, [searchParams])

  const handleAuth = async (e: React.FormEvent, isLogin: boolean) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setMessage(null)
    
    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)
    if (!isLogin) {
      formData.append('name', name)
    }

    try {
      const result = isLogin ? await login(formData) : await signup(formData)
      
      if (result.error) {
        setError(result.error)
      } else if (result.success) {
        if (isLogin) {
          // Let the onAuthStateChange handle the redirect
          const redirectTo = searchParams.get('redirectTo') || '/fyp'
          router.push(redirectTo)
        } else {
          setMessage('Sign up successful! Please check your email to confirm your account.')
          setSelectedTab('login')
          setName('')
          setEmail('')
          setPassword('')
        }
      }
    } catch (error: any) {
      setError(error.message || `An error occurred during ${isLogin ? 'login' : 'signup'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    
    // Get stored responses
    const storedData = LocalStorage.getResponses()
    console.log('Stored responses before signup:', storedData) // Debug log
    
    if (storedData) {
      formData.append('stored_responses', JSON.stringify({
        responses: storedData.responses,
        timestamp: storedData.timestamp || new Date().toISOString()
      }))
    }

    const result = await signup(formData)
    console.log('Signup result:', result) // Debug log

    if (result.success) {
      // Only clear localStorage after successful signup
      LocalStorage.clear()
    }
    
    // Handle result...
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#e7bab2] to-[#f9eeec] p-4">
      <Tabs 
        value={selectedTab} 
        onValueChange={setSelectedTab} 
        className="w-[400px]"
      >
        <TabsList className="grid w-full grid-cols-2 rounded-full p-1 bg-[#f3ddd9]">
          <TabsTrigger value="login" className="rounded-full transition-all duration-300 data-[state=active]:bg-[#e7bab2] data-[state=active]:text-foreground">
            Login
          </TabsTrigger>
          <TabsTrigger value="signup" className="rounded-full transition-all duration-300 data-[state=active]:bg-[#e7bab2] data-[state=active]:text-foreground">
            Sign Up
          </TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            onSubmit={(e) => handleAuth(e, true)}
            className="space-y-4 bg-white p-8 rounded-lg shadow-md"
          >
            {message && <p className="text-green-500 text-sm mb-4">{message}</p>}
            <div>
              <Label htmlFor="login-email">Email</Label>
              <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-[#f3ddd9]" />
            </div>
            <div>
              <Label htmlFor="login-password">Password</Label>
              <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-[#f3ddd9]" />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full bg-[#e7bab2] text-foreground hover:bg-[#e7bab2]/90" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Log In'}
            </Button>
          </motion.form>
        </TabsContent>
        <TabsContent value="signup">
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            onSubmit={(e) => handleAuth(e, false)}
            className="space-y-4 bg-white p-8 rounded-lg shadow-md"
          >
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="bg-[#f3ddd9]" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-[#f3ddd9]" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-[#f3ddd9]" />
            </div>
            <input 
              type="hidden" 
              name="stored_responses" 
              value={searchParams.get('responses') || ''} 
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full bg-[#e7bab2] text-foreground hover:bg-[#e7bab2]/90" disabled={isLoading}>
              {isLoading ? 'Signing up...' : 'Create Account'}
            </Button>
          </motion.form>
        </TabsContent>
      </Tabs>
    </div>
  )
}

