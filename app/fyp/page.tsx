'use client'

import { useState, useRef, useEffect } from "react"
import { Post as PostComponent } from "@/components/post"
import { ProfileComponent } from "@/components/ProfileComponent"
import { cn } from "@/lib/utils"
import { Post } from "@/types/post"
import { posts as initialPosts } from "@/data/posts"
import { useSearchParams, useRouter } from 'next/navigation'
import { useSupabase } from '@/app/supabase-provider'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Menu } from "lucide-react"

export default function FYPPage() {
  const searchParams = useSearchParams()
  const view = searchParams.get('view')
  const [activeTab, setActiveTab] = useState(view === 'profile' ? 'profile' : 'for-you')
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [currentIndex, setCurrentIndex] = useState(0)
  const touchStartY = useRef(0)
  const touchEndY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const isSwipingRef = useRef(false)
  const { supabase, user } = useSupabase()
  const router = useRouter()

  const handleSwipe = (direction: 'up' | 'down') => {
    if (isSwipingRef.current) return
    isSwipingRef.current = true
    if (direction === 'up' && currentIndex < posts.length - 1) {
      setCurrentIndex(prevIndex => prevIndex + 1)
    } else if (direction === 'down' && currentIndex > 0) {
      setCurrentIndex(prevIndex => prevIndex - 1)
    }
    setTimeout(() => {
      isSwipingRef.current = false
    }, 300)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndY.current = e.touches[0].clientY
  }

  const handleTouchEnd = () => {
    const diffY = touchStartY.current - touchEndY.current
    if (diffY > 50) {
      handleSwipe('up')
    } else if (diffY < -50) {
      handleSwipe('down')
    }
    touchStartY.current = 0
    touchEndY.current = 0
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY > 0) {
      handleSwipe('up')
    } else if (e.deltaY < 0) {
      handleSwipe('down')
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/auth')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f9eeec] p-4">
      <div className="fixed inset-0 bg-[#f9eeec]">
        <div className="absolute top-0 left-0 right-0 z-20">
          <div className="flex justify-center items-center px-4 pt-2 relative">
            {activeTab === 'profile' && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative text-gray-800 rounded-full p-1.5 shadow-md hover:bg-[#E8D5CB] transition-colors w-9 h-9 flex items-center justify-center">
                      <Menu className="w-3 h-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-white rounded-lg shadow-lg p-2">
                    <DropdownMenuItem 
                      className="px-3 py-2 text-sm cursor-pointer hover:bg-[#f3ddd9] rounded-md transition-colors"
                      onClick={handleLogout}
                    >
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            <div className="flex w-full max-w-[200px] relative">
              <button 
                className={cn(
                  "flex-1 py-2 text-base font-medium transition-colors relative",
                  activeTab === 'for-you' ? "text-black" : "text-gray-400"
                )}
                onClick={() => setActiveTab('for-you')}
              >
                For You
              </button>
              <button
                className={cn(
                  "flex-1 py-2 text-base font-medium transition-colors relative",
                  activeTab === 'profile' ? "text-black" : "text-gray-400"
                )}
                onClick={() => setActiveTab('profile')}
              >
                Profile
              </button>
              <div 
                className="absolute bottom-0 h-[2px] bg-black transition-all duration-300 w-1/2"
                style={{
                  transform: `translateX(${activeTab === 'profile' ? '100%' : '0'})`
                }}
              />
            </div>
          </div>
        </div>

        <div className="absolute inset-0 top-[56px] bottom-0">
          {activeTab === 'for-you' ? (
            <div 
              ref={containerRef}
              className="h-full w-full"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onWheel={handleWheel}
            >
              <div
                className="absolute inset-0 w-full h-full"
                style={{
                  transform: `translateY(-${currentIndex * 100}%)`,
                  transition: 'transform 300ms ease-out'
                }}
              >
                {posts.map((post, index) => (
                  <div
                    key={post.id}
                    className="absolute top-0 left-0 w-full h-full"
                    style={{
                      transform: `translateY(${index * 100}%)`,
                    }}
                  >
                    <PostComponent post={post} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full overflow-auto">
              <ProfileComponent />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

