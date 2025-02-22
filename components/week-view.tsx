'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from "@/lib/utils"
import { motion, useAnimation, PanInfo } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Task {
  id: number
  title: string
  amount: string
  time: string
  icon: string
  progress: number
  date: string
}

interface WeekViewProps {
  onDateSelect: (date: Date) => void
  selectedDate: Date
  tasks: Task[]
}

export function WeekView({ onDateSelect, selectedDate, tasks }: WeekViewProps) {
  const [dates, setDates] = useState<Date[]>([])
  const [currentIndex, setCurrentIndex] = useState(10)
  const [displayMonth, setDisplayMonth] = useState('')
  const controls = useAnimation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTaskDate, setSelectedTaskDate] = useState<Date | null>(null)

  useEffect(() => {
    const today = new Date()
    const datesArray = []
    for (let i = -10; i <= 10; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      datesArray.push(date)
    }
    setDates(datesArray)
    setDisplayMonth(monthNames[today.getMonth()])
  }, [])

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50
    const newIndex = info.offset.x > threshold ? currentIndex - 1 : 
                     info.offset.x < -threshold ? currentIndex + 1 : 
                     currentIndex
    
    const adjustedIndex = Math.max(2, Math.min(newIndex, dates.length - 3))
    setCurrentIndex(adjustedIndex)
    setDisplayMonth(monthNames[dates[adjustedIndex].getMonth()])
    
    controls.start({ 
      x: 0, 
      transition: { 
        type: "spring", 
        stiffness: 500, 
        damping: 50,
        mass: 1
      } 
    })
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const handleDateClick = (date: Date) => {
    onDateSelect(date)
    setSelectedTaskDate(date)
    setIsDialogOpen(true)
    setDisplayMonth(monthNames[date.getMonth()])
    
    const newIndex = dates.findIndex(d => d.toDateString() === date.toDateString())
    if (newIndex !== -1) {
      setCurrentIndex(Math.min(Math.max(newIndex, 2), dates.length - 3))
    }
  }

  const tasksForSelectedDate = selectedTaskDate 
    ? tasks.filter(task => task.date === selectedTaskDate.toISOString().split('T')[0])
    : []

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="text-center mb-4">
        <span className="inline-block text-gray-500 font-medium transition-colors">
          {displayMonth}
        </span>
      </div>
      <motion.div
        ref={containerRef}
        className="flex items-center justify-center gap-1 px-1"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        animate={controls}
        transition={{ type: "spring", stiffness: 500, damping: 50 }}
      >
        {dates.slice(Math.max(0, currentIndex - 2), Math.min(dates.length, currentIndex + 3)).map((date, index) => {
          const isSelected = date.toDateString() === selectedDate.toDateString()
          const isToday = date.toDateString() === new Date().toDateString()
          const tasksForDate = tasks.filter(task => task.date === date.toISOString().split('T')[0])
          const hasCompletedTasks = tasksForDate.some(task => task.progress === 100)
          
          return (
            <motion.div
              key={date.toISOString()}
              className="relative flex-shrink-0 w-[68px]"
            >
              <motion.button
                onClick={() => handleDateClick(date)}
                className={cn(
                  "relative flex flex-col items-center justify-between w-full h-[140px] py-6 px-1 z-10 rounded-[36px]",
                  "transition-colors duration-200",
                  isSelected ? "text-gray-800" : "text-gray-400"
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <span className="text-sm font-medium">
                  {dayNames[date.getDay()]}
                </span>
                <div 
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-colors duration-200",
                    isSelected ? 'bg-green-500' : 
                    hasCompletedTasks ? 'bg-blue-500' : 
                    'bg-gray-300'
                  )} 
                />
                <span className="text-2xl font-light">
                  {String(date.getDate()).padStart(2, '0')}
                </span>
              </motion.button>
              {isSelected && (
                <motion.div 
                  className="absolute bg-gradient-to-b from-[#e7bab2] to-[#f9eeec] rounded-[36px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  style={{
                    width: '100%',
                    height: '100%',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 0,
                  }}
                />
              )}
            </motion.div>
          )
        })}
      </motion.div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-gradient-to-b from-[#e7bab2] to-[#f9eeec]">
          <DialogHeader>
            <DialogTitle>Tasks for {selectedTaskDate?.toDateString()}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[300px] w-full rounded-md border p-4">
            {tasksForSelectedDate.length > 0 ? (
              tasksForSelectedDate.map(task => (
                <div key={task.id} className="mb-4 p-3 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">{task.icon}</span>
                    <div>
                      <h3 className="font-medium text-gray-800">{task.title}</h3>
                      <p className="text-sm text-gray-600">{task.amount} - {task.time}</p>
                    </div>
                  </div>
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#e7bab2] rounded-full h-2"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-600">No tasks for this date.</p>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}