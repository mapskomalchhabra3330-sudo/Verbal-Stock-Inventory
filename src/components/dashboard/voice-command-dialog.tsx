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
import { useToast } from "@/hooks/use-toast"

type VoiceCommandDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Status = "idle" | "listening" | "processing" | "success" | "error"

export function VoiceCommandDialog({ open, onOpenChange }: VoiceCommandDialogProps) {
  const [status, setStatus] = useState<Status>("idle")
  const [result, setResult] = useState<VoiceCommandResponse | null>(null)
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    hasRecognitionSupport,
    error: recognitionError,
  } = useSpeechRecognition()
  const router = useRouter()
  const { toast } = useToast()

  const handleCommandProcessing = useCallback(async (command: string) => {
    if (command.trim() === "") {
        setStatus("idle")
        return
    }
    setStatus("processing")
    try {
      const res = await processVoiceCommand(command)
      setResult(res)
      setStatus(res.success ? "success" : "error")

      if (res.action === 'REFRESH_DASHBOARD') {
        router.refresh()
      }
      if (res.action === 'REFRESH_INVENTORY') {
        router.refresh()
      }
      if (res.action === 'OPEN_ADD_ITEM_DIALOG') {
         // This needs to be handled by the parent component that calls this dialog
      }

    } catch (e) {
      setResult({ success: false, message: "An unexpected error occurred." })
      setStatus("error")
    }
  }, [router])

  useEffect(() => {
    if (open) {
      setStatus("idle")
      setResult(null)
      startListening()
    } else {
      stopListening()
    }
  }, [open, startListening, stopListening])

  useEffect(() => {
    if (!isListening && transcript && status === 'listening') {
      handleCommandProcessing(transcript)
    }
  }, [isListening, transcript, handleCommandProcessing, status])
  
  useEffect(() => {
    if(isListening && status === 'idle') {
        setStatus('listening');
    }
  }, [isListening, status])

  useEffect(() => {
    if(recognitionError) {
        setStatus('error');
        setResult({ success: false, message: `Speech recognition error: ${recognitionError}` });
    }
  }, [recognitionError])

  const handleMicClick = () => {
    if (isListening) {
      stopListening()
      if(transcript) {
          handleCommandProcessing(transcript)
      } else {
          setStatus('idle');
      }
    } else {
      startListening()
    }
  }
  
  const getStatusContent = () => {
    switch (status) {
      case "listening":
        return {
          icon: <Mic className="size-12 text-primary animate-pulse" />,
          title: "Listening...",
          description: "Speak your command clearly.",
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

  useEffect(() => {
    if (!hasRecognitionSupport && open) {
        toast({
            variant: "destructive",
            title: "Unsupported Browser",
            description: "Speech recognition is not supported in your browser. Please try Chrome or Safari.",
        })
    }
  }, [hasRecognitionSupport, open, toast, onOpenChange]);

  if (!hasRecognitionSupport) {
      return null;
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
