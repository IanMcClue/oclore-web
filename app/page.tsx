"use client";

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ReturnArrow, CheckmarkComplete } from '@/components/icons'
import { AlertCircle, Upload } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation'
import { TempSession } from '@/utils/session'
import { createAnonymousClient } from '@/utils/supabase/anonymous'
import { Json } from '@/types/supabase'
import { LocalStorage } from '@/utils/session'
import { prompts } from '@/utils/prompts'

export default function Home() {
  const [currentPrompt, setCurrentPrompt] = useState(0)
  const [responses, setResponses] = useState<string[]>(Array(prompts.length).fill(''))
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [submittedResponses, setSubmittedResponses] = useState<Set<number>>(new Set())
  const [showError, setShowError] = useState(false)
  const [username, setUsername] = useState('')
  const [birthChart, setBirthChart] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [showNotification, setShowNotification] = useState(false)
  const [userStory, setUserStory] = useState<string[]>([])
  const router = useRouter()
  const anonymousClient = createAnonymousClient()
  const [isSaving, setIsSaving] = useState(false)
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null)

  // Initialize responses from localStorage
  useEffect(() => {
    const storedData = LocalStorage.getResponses()
    if (storedData?.responses && Array.isArray(storedData.responses)) {
      // Ensure we have the correct number of responses
      const newResponses = Array(prompts.length).fill('')
      storedData.responses.forEach((response, index) => {
        if (index < newResponses.length) {
          newResponses[index] = response || ''
        }
      })
      setResponses(newResponses)
      
      // Set username if it exists
      if (storedData.responses[0]) {
        setUsername(storedData.responses[0])
      }
    }
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (textareaRefs.current[currentPrompt]) {
        adjustTextareaHeight(textareaRefs.current[currentPrompt]);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentPrompt]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollPosition = container.scrollTop;
      const totalHeight = container.scrollHeight - container.clientHeight;
      const progress = scrollPosition / totalHeight;
      setScrollProgress(progress);
      
      const currentPromptIndex = Math.floor(progress * prompts.length);
      setCurrentPrompt(currentPromptIndex);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Delay focus to ensure smooth transition and animation completion
    const focusTimer = setTimeout(() => {
      if (currentPrompt === 0) {
        const nameInput = document.getElementById('name-input');
        if (nameInput) nameInput.focus();
      } else {
        const currentTextarea = textareaRefs.current[currentPrompt];
        if (currentTextarea) currentTextarea.focus();
      }
    }, 900); // Increased delay to 900ms to ensure animation is complete

    return () => clearTimeout(focusTimer);
  }, [currentPrompt]);

  // Load any existing responses for temp user
  useEffect(() => {
    const loadExistingResponses = async () => {
      const tempId = TempSession.getId()
      if (!tempId) return

      const { data: existingResponses } = await anonymousClient.getResponses(tempId)
      if (existingResponses && Array.isArray(existingResponses)) {
        // Initialize with empty strings if no responses exist
        const initialResponses = Array(prompts.length).fill('')
        // Merge existing responses with initial empty array
        setResponses(prev => {
          const newResponses = [...initialResponses]
          existingResponses.forEach((response, index) => {
            if (index < newResponses.length) {
              newResponses[index] = response
            }
          })
          return newResponses
        })
      }
    }

    loadExistingResponses()
  }, [])

  // Save responses as user types
  const saveResponsesToDatabase = async (responses: string[]) => {
    setIsSaving(true)
    try {
      const tempId = TempSession.getId()!
      const { error } = await anonymousClient.saveResponses(tempId, responses)
      
      if (error) {
        console.error('Failed to save responses:', error)
        // Optionally show error notification
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleResponseChange = async (index: number, value: string) => {
    const newResponses = [...responses]
    newResponses[index] = value
    setResponses(newResponses)

    setIsSaving(true)
    try {
      const tempId = TempSession.getId()!
      console.log('Saving with tempId:', tempId)
      const { error } = await anonymousClient.saveResponses(tempId, newResponses)
      if (error) {
        console.error('Save error:', error)
      }
    } finally {
      setIsSaving(false)
    }
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) clearTimeout(saveTimeout)
    }
  }, [saveTimeout])

  const handleNext = () => {
    const currentResponse = responses[currentPrompt];
    if (currentPrompt === 0 && !username.trim()) {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }
    if (currentPrompt !== 0 && (!currentResponse || !currentResponse.trim())) {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }

    setShowSuccessAnimation(true);
    setSubmittedResponses(prev => new Set(prev).add(currentPrompt));

    if (currentPrompt === 0) {
      localStorage.setItem('userName', username);
    }

    if (currentPrompt === prompts.length - 1) {
      const allResponses = [username, ...responses.slice(1)];
      setUserStory(allResponses);
      localStorage.setItem('userResponses', JSON.stringify(allResponses));
      console.log("All responses:", allResponses);
      console.log("Birth chart:", birthChart ? birthChart.name : "Not uploaded");
      setShowNotification(true);
    } else {
      if (currentPrompt === 0) {
        setResponses(prev => {
          const newResponses = [...prev];
          newResponses[0] = username;
          return newResponses;
        });
      }
      const nextPrompt = currentPrompt + 1;
    
      setTimeout(() => {
        setShowSuccessAnimation(false);
        setCurrentPrompt(nextPrompt);
        if (containerRef.current) {
          containerRef.current.scrollTo({
            top: nextPrompt * window.innerHeight,
            behavior: 'smooth'
          });
        }
      }, 800);
    }
  };

  const updateResponse = (value: string, index: number) => {
    const newResponses = [...responses]
    newResponses[index] = value
    setResponses(newResponses)
    if (textareaRefs.current[index]) {
      adjustTextareaHeight(textareaRefs.current[index]);
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setBirthChart(file)
      console.log(`Uploaded file: ${file.name}`)
    }
  }

  const triggerFileUpload = () => {
    fileInputRef.current?.click()
  }

  const setTextAreaRef = (index: number, el: HTMLTextAreaElement | null) => {
    textareaRefs.current[index] = el;
    if (el) {
      adjustTextareaHeight(el);
    }
  };

  const adjustTextareaHeight = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  };

  const handleCreateAccount = async () => {
    try {
      const storedData = LocalStorage.getResponses()
      const displayName = username || storedData?.responses[0] || ''
      const responsesParam = encodeURIComponent(JSON.stringify(storedData))
      
      router.push(`/auth?tab=signup&display_name=${encodeURIComponent(displayName)}&responses=${responsesParam}`)
    } catch (error) {
      console.error('Error in create account:', error)
    }
  }

  const handleLogin = () => {
    setShowNotification(false)
    router.push('/auth?tab=login')
  }

  // Debug: Check if responses exist on mount
  useEffect(() => {
    const checkResponses = async () => {
      const tempId = TempSession.getId()
      if (tempId) {
        const { data } = await anonymousClient.getResponses(tempId)
        console.log('Existing responses:', data)
      }
    }
    checkResponses()
  }, [])

  return (
    <div className="min-h-screen bg-[#f9eeeb] text-black overflow-hidden">
      {/* Segmented Progress Bar */}
      <div className="fixed top-4 left-4 right-4 flex gap-1 z-40">
        {prompts.map((_, index) => (
          <motion.div
            key={index}
            className="h-1 flex-1 rounded-full"
            initial={{ backgroundColor: "#e0e0e0" }}
            animate={{
              backgroundColor: index <= Math.floor(scrollProgress * prompts.length) ? "#9e9e9e" : "#e0e0e0"
            }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>

      <div ref={containerRef} className="h-screen overflow-y-auto snap-y snap-mandatory">
        {prompts.map((prompt, index) => (
          <div key={prompt.id} className="h-screen snap-start flex items-center justify-center">
            <div className="max-w-xl w-full px-6 text-center">
              <AnimatePresence mode="wait">
                <motion.h2
                  key={`title-${prompt.id}`}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="text-4xl font-serif mb-8"
                >
                  {index === 0 ? "Welcome to Your Future Self Journal" : "Imagine your future self in five years"}
                </motion.h2>
              </AnimatePresence>
              <AnimatePresence mode="wait">
                <motion.p
                  key={`question-${prompt.id}`}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  transition={{ duration: 0.5, ease: "easeInOut", delay: 0.2 }}
                  className="text-lg mb-4"
                >
                  {prompt.question}
                </motion.p>
              </AnimatePresence>
              <div className="relative">
                {index === 0 ? (
                  <div className="space-y-4">
                    <input
                      id="name-input"
                      type="text"
                      placeholder="Enter your name"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onFocus={() => setCurrentPrompt(0)}
                      className="w-full mt-4 bg-transparent border-b border-black/30 focus:outline-none focus:border-black px-2 py-1 text-lg placeholder:text-black/30 text-center"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleNext()
                        }
                      }}
                    />
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept="image/*,.pdf"
                        id="birth-chart-upload"
                      />
                      <button
                        type="button"
                        onClick={triggerFileUpload}
                        className="mt-4 flex items-center justify-center space-x-2 text-sm text-black/50 hover:text-black/70 transition-colors mx-auto"
                      >
                        <Upload className="w-4 h-4" />
                        <span>{birthChart ? 'Change Birth Chart' : 'Upload Birth Chart (Optional)'}</span>
                      </button>
                      {birthChart && (
                        <p className="text-sm text-black/50 mt-2">
                          Uploaded: {birthChart.name}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <textarea
                    ref={(el) => setTextAreaRef(index, el)}
                    value={responses[index]}
                    onChange={(e) => handleResponseChange(index, e.target.value)}
                    onFocus={() => setCurrentPrompt(index)}
                    placeholder="What's on your mind..."
                    className="w-full mt-4 bg-transparent border-none focus:outline-none focus:ring-0 resize-none text-lg placeholder:text-black/30 text-center pr-10 min-h-[100px]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleNext()
                      }
                    }}
                  />
                )}
                <div className="absolute right-0 bottom-0 flex items-center">
                  <AnimatePresence mode="wait">
                    {submittedResponses.has(index) ? (
                      <motion.div
                        key="checkmark"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        className={`text-pink-500 ${showSuccessAnimation ? 'glow-effect' : ''}`}
                      >
                        <CheckmarkComplete />
                      </motion.div>
                    ) : (
                      <motion.button
                        key="arrow"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        className="text-black/30"
                        onClick={handleNext}
                      >
                        <ReturnArrow />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
                {/* Error Notification */}
                <AnimatePresence>
                  {showError && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 flex items-center gap-2 bg-white rounded-lg shadow-lg py-2 px-3"
                    >
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                      <span className="text-sm">Please fill out this field.</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showNotification} onOpenChange={setShowNotification}>
        <DialogContent className="bg-[#f9eeeb] text-black border-black/20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif text-center">
              To save your future story, please:
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-center mb-2 text-black/70">
                New here? Create an account to see your future story
              </p>
              <Button
                onClick={handleCreateAccount}
                className="w-full bg-black text-[#f9eeeb] hover:bg-black/90"
              >
                Create Account
              </Button>
            </div>
            <div>
              <p className="text-center mb-2 text-black/70">Already have an account?</p>
              <Button
                onClick={handleLogin}
                className="w-full bg-black text-[#f9eeeb] hover:bg-black/90"
              >
                Login
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isSaving && (
        <div className="fixed bottom-4 right-4 bg-black/10 backdrop-blur-md rounded-full px-4 py-2">
          Saving...
        </div>
      )}
    </div>
  )
}

