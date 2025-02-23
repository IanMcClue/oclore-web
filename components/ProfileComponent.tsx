'use client'

import { useState, useEffect, useCallback } from 'react'
import { ProgressRing } from '@/components/progress-ring'
import { TaskList } from '@/components/task-list'
import { ManifestationTimer } from '@/components/manifestation-timer'
import { WeekView } from '@/components/week-view'
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Menu } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { useSupabase } from '@/app/supabase-provider'
import { useRouter } from 'next/navigation'
import { Database } from '@/types/supabase'

interface Task {
  id: number
  title: string
  amount: string
  time: string
  icon: string
  progress: number
  date: string
}

interface Routine {
  id: string
  routine_name: string
  frequency: string
  time_of_day: string
}

export function ProfileComponent() {
  const { supabase, user } = useSupabase()
  const router = useRouter()
  const [name, setName] = useState('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [overallProgress, setOverallProgress] = useState(0)
  const [futureStory, setFutureStory] = useState('')
  const [routines, setRoutines] = useState<Routine[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [newTask, setNewTask] = useState({ title: '', amount: '', time: '' })
  const [selectedEmoji, setSelectedEmoji] = useState('💧')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [showLogoutNotification, setShowLogoutNotification] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const displayName =
          user.user_metadata.display_name ||
          user.user_metadata.full_name ||
          user.email?.split('@')[0] ||
          'there'
        setName(displayName)

        // Commented out until type issues are resolved:
        /*
        const { data: userData, error: userError } = await supabase
          .from<Database["public"]["Tables"]["user_stories"]["Row"]>('user_stories')
          .select('story')
          .eq('user_id', user.id)
          .single()
        if (!userError && userData) {
          setFutureStory(userData.story)
        }
        */

        // Commented out until type issues are resolved:
        /*
        const { data: routinesData, error: routinesError } = await supabase
          .from<
            Database["public"]["Tables"]["user_routines"]["Row"],
            Database["public"]["Tables"]["user_routines"]["Insert"]
          >('user_routines')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
        if (!routinesError && routinesData) {
          const mappedRoutines: Routine[] = routinesData.map(routine => ({
            id: routine.id,
            routine_name: routine.routine_name,
            frequency: routine.frequency,
            time_of_day: routine.time_of_day,
          }))
          setRoutines(mappedRoutines)
        }
        */

        // Commented out until type issues are resolved:
        /*
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from<
            Database["public"]["Tables"]["subscriptions"]["Row"],
            Database["public"]["Tables"]["subscriptions"]["Insert"]
          >('subscriptions')
          .select('status, created_at')
          .eq('user_id', user.id)
          .single()
        if (
          !subscriptionError &&
          subscriptionData &&
          subscriptionData.status === 'active' &&
          subscriptionData.created_at
        ) {
          setIsSubscribed(true)
          createWeeklyTasks(new Date(subscriptionData.created_at))
        }
        */
      }
    }
    fetchUserData()
  }, [supabase, user])

  const createWeeklyTasks = (startDate: Date) => {
    const weeklyTasks: Task[] = []
    for (let i = 0; i < 7; i++) {
      const taskDate = new Date(startDate)
      taskDate.setDate(startDate.getDate() + i)
      const dateString = taskDate.toISOString().split('T')[0]

      routines.forEach((routine, index) => {
        weeklyTasks.push({
          id: Date.now() + index + i * 1000,
          title: routine.routine_name,
          amount: routine.frequency,
          time: routine.time_of_day,
          icon: '🔄',
          progress: 0,
          date: dateString,
        })
      })
    }
    setTasks(prevTasks => [...prevTasks, ...weeklyTasks])
  }

  const calculateOverallProgress = useCallback((tasks: Task[], date: Date) => {
    const tasksForDate = tasks.filter(
      task => task.date === date.toISOString().split('T')[0]
    )
    const totalProgress = tasksForDate.reduce((sum, task) => sum + task.progress, 0)
    return tasksForDate.length > 0 ? Math.round(totalProgress / tasksForDate.length) : 0
  }, [])

  useEffect(() => {
    setOverallProgress(calculateOverallProgress(tasks, selectedDate))
  }, [tasks, selectedDate, calculateOverallProgress])

  const handleTasksChange = useCallback(
    (updatedTasks: Task[]) => {
      setTasks(updatedTasks)
      setOverallProgress(calculateOverallProgress(updatedTasks, selectedDate))
    },
    [calculateOverallProgress, selectedDate]
  )

  const addNewTask = useCallback(() => {
    if (newTask.title && newTask.amount && newTask.time) {
      const newTaskItem: Task = {
        id: Date.now(),
        title: newTask.title,
        amount: newTask.amount,
        time: newTask.time,
        icon: selectedEmoji,
        progress: 0,
        date: selectedDate.toISOString().split('T')[0],
      }
      setTasks(prevTasks => [...prevTasks, newTaskItem])
      setNewTask({ title: '', amount: '', time: '' })
      setSelectedEmoji('💧')
    }
  }, [newTask, selectedEmoji, selectedDate])

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setShowLogoutNotification(true)
      setTimeout(() => {
        router.push('/auth')
      }, 1500)
    } catch (error) {
      console.error('Error logging out:', error)
      alert('Failed to log out. Please try again.')
    } finally {
      setIsLoggingOut(false)
    }
  }

  // Simulating fetching tasks
  const sampleTasks: Task[] = [
    {
      id: 1,
      title: "Morning Meditation",
      amount: "15 min",
      time: "8:00 AM",
      icon: "🧘‍♀️",
      progress: 0,
      date: new Date().toISOString().split("T")[0],
    }
  ]
  setTasks(sampleTasks) // Set the sample tasks to the state

  return (
    <ScrollArea className="h-screen bg-gradient-to-b from-[#f9eeec] to-[#f3ddd9]">
      <div className="w-full max-w-[100vw] mx-auto px-4 py-4 sm:max-w-md sm:py-8 sm:px-4">
        <div className="mb-8 w-full overflow-x-hidden">
          <div className="flex-grow min-w-0">
            <WeekView
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              tasks={tasks}
            />
          </div>
        </div>

        {showLogoutNotification && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-black text-white px-6 py-3 rounded-lg shadow-lg">
              Successfully logged out!
            </div>
          </div>
        )}

        <h1 className="text-2xl font-bold mb-2 text-center">Hi, {name}</h1>
        <p className="text-gray-600 mb-8 text-center">
          Great, your daily plan is almost done!
        </p>

        <div className="flex justify-center mb-8">
          <ProgressRing
            progress={overallProgress}
            avatarSrc=""
            avatarFallback="Upload image here"
          />
        </div>

        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold mb-2">Future Story</h2>
          <Textarea
            placeholder="Write your future story here..."
            value={futureStory}
            onChange={(e) => setFutureStory(e.target.value)}
            className="w-[calc(100%-8px)] h-24 resize-none mx-auto"
          />
        </div>

        <h2 className="text-xl font-bold text-center mb-4">Plan for the day</h2>

        <TaskList
          initialTasks={tasks.filter(
            task => task.date === selectedDate.toISOString().split('T')[0]
          )}
          onTasksChange={handleTasksChange}
          selectedDate={selectedDate}
          onAddNewTask={addNewTask}
          newTask={newTask}
          setNewTask={setNewTask}
          selectedEmoji={selectedEmoji}
          setSelectedEmoji={setSelectedEmoji}
          className="px-2"
        />

        {isSubscribed && (
          <div className="mt-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Your Personalized Routines</h2>
            <div className="bg-white p-4 rounded-lg shadow">
              {routines.map(routine => (
                <div key={routine.id} className="mb-2 p-2 border-b">
                  <p className="font-medium">{routine.routine_name}</p>
                  <p className="text-sm text-gray-600">
                    {routine.frequency} at {routine.time_of_day}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 mb-8">
          <ManifestationTimer />
        </div>
      </div>
    </ScrollArea>
  )
}
