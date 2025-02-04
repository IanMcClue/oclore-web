'use client'

import { useState, useEffect, useRef } from 'react'
import { PauseIcon, PlayIcon, MonitorStopIcon as StopIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ManifestationTimer() {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRecording])

  const checkBrowserCompatibility = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Your browser doesn't support audio recording");
      return false;
    }
    return true;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        chunksRef.current = [];
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error: any) {
      console.error('Error starting recording:', error.name, error.message);
      setError(`Error: ${error.message || 'Unable to access the microphone'}`);
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setRecordingTime(0)
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      if (checkBrowserCompatibility()) {
        startRecording();
      }
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <h2 className="text-xl font-bold">Manifestation Timer</h2>
      <div className="text-4xl font-mono">
        {String(Math.floor(recordingTime / 60)).padStart(2, '0')}:
        {String(recordingTime % 60).padStart(2, '0')}
      </div>
      <div className="flex space-x-2">
        <Button onClick={toggleRecording}>
          {isRecording ? <PauseIcon /> : <PlayIcon />}
        </Button>
        <Button onClick={stopRecording} disabled={!isRecording}>
          <StopIcon />
        </Button>
      </div>
      {error && (
        <div className="text-red-500 mt-2">
          {error}
        </div>
      )}
      {audioURL && (
        <audio controls src={audioURL} className="w-full max-w-md">
          Your browser does not support the audio element.
        </audio>
      )}
    </div>
  )
}

