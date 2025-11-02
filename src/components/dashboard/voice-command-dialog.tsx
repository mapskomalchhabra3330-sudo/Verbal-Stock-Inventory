"use client"

import { useState, useEffect, useCallback } from "react"
import { Mic, BrainCircuit, CheckCircle, XCircle, MicOff } from "lucide-react"
import { useRouter } from "next/navigation"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"
import { processVoiceCommand } from "@/lib/actions"
import type { VoiceCommandResponse } from "@/lib/types"

type VoiceCommandDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Status = "idle" | "listening" | "processing" | "success" | "error"

export function VoiceCommandDialog({ open, onOpenChange }: VoiceCommandDialogProps) {
  const [status, setStatus] = useState<Status>("idle")
  const [result, setResult] = useState<VoiceCommandResponse | null>(null)
  const router = useRouter()
  
  const handleProcessCommand = useCallback(async (command: string) => {
    if (command.trim() === "") {
        setStatus("idle")
        return
    }
    setStatus("processing")
    try {
      const res = await processVoiceCommand(command)
      setResult(res)
      setStatus(res.success ? "success" : "error")

      if (res.action === 'REFRESH_DASHBOARD' || res.action === 'REFRESH_INVENTORY') {
        router.refresh()
      }
      
    } catch (e) {
      setResult({ success: false, message: "An unexpected error occurred." })
      setStatus("error")
    }
  }, [router]);

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    hasRecognitionSupport,
    error: recognitionError,
  } = useSpeechRecognition({ onTranscriptFinal: handleProcessCommand });


  useEffect(() => {
    if (open) {
      setStatus("listening")
      setResult(null)
      startListening()
    } else {
      stopListening()
      setStatus("idle")
    }
  }, [open]) // Dependencies simplified

  useEffect(() => {
    if(recognitionError) {
        setStatus('error');
        setResult({ success: false, message: `Speech recognition error: ${recognitionError}` });
    }
  }, [recognitionError])

  const handleMicClick = () => {
    if (isListening) {
      stopListening()
    } else {
      setStatus('listening');
      startListening()
    }
  }
  
  const getStatusContent = () => {
    switch (status) {
      case "listening":
        return {
          icon: <Mic className="size-12 text-primary animate-pulse" />,
          title: "Listening...",
          description: transcript || "Speak your command clearly.",
        }
      case "processing":
        return {
          icon: <BrainCircuit className="size-12 text-primary animate-spin" />,
          title: "Processing...",
          description: `Analyzing your command: "${transcript}"`,
        }
      case "success":
        return {
          icon: <CheckCircle className="size-12 text-green-500" />,
          title: "Success!",
          description: result?.message || "Command executed successfully.",
        }
      case "error":
        return {
          icon: <XCircle className="size-12 text-destructive" />,
          title: "Error",
          description: result?.message || "Something went wrong.",
        }
      case "idle":
      default:
        return {
          icon: <Mic className="size-12 text-muted-foreground" />,
          title: "Ready to Listen",
          description: "Click the microphone to start.",
        }
    }
  }

  const { icon, title, description } = getStatusContent()

  if (!hasRecognitionSupport) {
    // This should be handled by the parent, but as a fallback:
    if (open) onOpenChange(false)
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] text-center">
        <DialogHeader>
          <DialogTitle className="text-center">Voice Command</DialogTitle>
          <DialogDescription className="text-center">
            Manage your inventory with your voice.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <div className="mb-4">{icon}</div>
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button
            type="button"
            size="icon"
            className="size-16 rounded-full"
            onClick={handleMicClick}
            variant={isListening ? "destructive" : "default"}
          >
            {isListening ? (
              <MicOff className="size-8" />
            ) : (
              <Mic className="size-8" />
            )}
            <span className="sr-only">{isListening ? "Stop listening" : "Start listening"}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
