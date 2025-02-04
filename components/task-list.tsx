'use client'

import { useState, useCallback, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { TaskItem } from './task-item'
import { PlusIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { EmojiPicker } from './emoji-picker'
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

interface TaskListProps {
  initialTasks: Task[]
  onTasksChange: (tasks: Task[]) => void
  selectedDate: Date
  onAddNewTask: () => void
  newTask: { title: string; amount: string; time: string }
  setNewTask: React.Dispatch<React.SetStateAction<{ title: string; amount: string; time: string }>>
  selectedEmoji: string
  setSelectedEmoji: React.Dispatch<React.SetStateAction<string>>
  className?: string
}

export function TaskList({ 
  initialTasks, 
  onTasksChange, 
  selectedDate, 
  onAddNewTask,
  newTask,
  setNewTask,
  selectedEmoji,
  setSelectedEmoji,
  className 
}: TaskListProps) {
  const [tasks, setTasks] = useState(initialTasks)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  const handleTaskProgress = useCallback((id: number) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === id) {
        const newProgress = (task.progress + 25) % 125 // Cycles through 0, 25, 50, 75, 100
        return { ...task, progress: newProgress }
      }
      return task
    })
    setTasks(updatedTasks)
    onTasksChange(updatedTasks)
  }, [tasks, onTasksChange])

  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return

    const newTasks = Array.from(tasks)
    const [reorderedItem] = newTasks.splice(result.source.index, 1)
    newTasks.splice(result.destination.index, 0, reorderedItem)

    setTasks(newTasks)
    onTasksChange(newTasks)
  }, [tasks, onTasksChange])

  const deleteTask = useCallback((id: number) => {
    const updatedTasks = tasks.filter(task => task.id !== id)
    setTasks(updatedTasks)
    onTasksChange(updatedTasks)
  }, [tasks, onTasksChange])

  const handleAddNewTask = () => {
    onAddNewTask()
    setIsDialogOpen(false)
  }

  return (
    <div className={`relative ${className}`}>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="tasks">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4 overflow-hidden">
              {tasks.map((task, index) => (
                <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`rounded-xl transition-shadow overflow-hidden ${
                        snapshot.isDragging ? 'shadow-lg' : 'hover:shadow-md'
                      }`}
                      style={{
                        ...provided.draggableProps.style,
                      }}
                    >
                      <TaskItem
                        {...task}
                        onProgress={() => handleTaskProgress(task.id)}
                        onDelete={() => deleteTask(task.id)}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full bg-[#e7bab2] hover:bg-[#E8D5CB] text-gray-800 rounded-full py-2 px-4 transition-colors flex items-center justify-center shadow-md mt-4">
            <PlusIcon className="w-5 h-5 mr-2" />
            Add New Task
          </Button>
        </DialogTrigger>
        <DialogContent className='bg-gradient-to-b from-[#e7bab2] to-[#f9eeec]'>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="Task name"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            />
            <Input
              placeholder="Amount (e.g., 500 ml, 30 min)"
              value={newTask.amount}
              onChange={(e) => setNewTask({ ...newTask, amount: e.target.value })}
            />
            <Input
              placeholder="Time (e.g., 2:30 PM)"
              value={newTask.time}
              onChange={(e) => setNewTask({ ...newTask, time: e.target.value })}
            />
            <EmojiPicker onEmojiSelect={(emoji) => setSelectedEmoji(emoji)} />
          </div>
          <Button onClick={handleAddNewTask} className="w-full bg-[#e7bab2] hover:bg-[#E8D5CB] text-gray-800 rounded-full py-2 px-4 transition-colors shadow-md">
            Add Task
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}

