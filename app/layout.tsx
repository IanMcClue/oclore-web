import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import { Home, User, Book, BookOpen } from 'lucide-react'
import SupabaseProvider from '@/app/supabase-provider'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FYP App',
  description: 'For You Page Application',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set(name, value, options)
          } catch (error) {
            // Handle cookie errors
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set(name, '', options)
          } catch (error) {
            // Handle cookie errors
          }
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="en" className={inter.className}>
      <body>
        <SupabaseProvider initialUser={user}>
          <div className="min-h-screen flex flex-col">
            <main className="flex-grow pb-16">{children}</main>
            {user && (
              <nav className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black/10 backdrop-blur-md rounded-full px-6 py-3 shadow-lg z-50">
                <ul className="flex space-x-8">
                  <li>
                    <Link href="/fyp">
                      <div className="p-2 rounded-full hover:bg-black/5 transition-colors duration-300">
                        <Home className="h-5 w-5 text-black" />
                      </div>
                    </Link>
                  </li>
                  <li>
                    <Link href="/future-story">
                      <div className="p-2 rounded-full hover:bg-black/5 transition-colors duration-300">
                        <BookOpen className="h-5 w-5 text-black" />
                      </div>
                    </Link>
                  </li>
                  <li>
                    <Link href="/fyp?view=profile">
                      <div className="p-2 rounded-full hover:bg-black/5 transition-colors duration-300">
                        <User className="h-5 w-5 text-black" />
                      </div>
                    </Link>
                  </li>
                </ul>
              </nav>
            )}
          </div>
        </SupabaseProvider>
      </body>
    </html>
  )
}

