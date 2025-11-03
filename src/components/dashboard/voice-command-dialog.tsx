
"use client"

import { useState, useEffect, useCallback } from "react"
import { Mic, BrainCircuit, CheckCircle, XCircle, MicOff } from "lucide-react"

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
  onAction?: (response: VoiceCommandResponse) => void
}

type Status = "idle" | "listening" | "processing" | "success" | "error"

export function VoiceCommandDialog({ open, onOpenChange, onAction }: VoiceCommandDialogProps) {
  const [status, setStatus] = useState<Status>("idle")
  const [lastTranscript, setLastTranscript] = useState("")
  
  const handleProcessCommand = useCallback(async (command: string) => {
    if (command.trim() === "") {
        setStatus("idle")
        return
    }
    setStatus("processing");
    try {
      const res = await processVoiceCommand(command)
      onAction?.(res);
      // Let the onAction handler decide to close the dialog.
      // If no onAction, we fall back to old behavior for non-mutating commands.
      if (!onAction) {
        setStatus(res.success ? "success" : "error")
      }
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      const errorResponse = { success: false, message: errorMessage };
      onAction?.(errorResponse)
      if (!onAction) {
        setStatus("error")
      }
    }
  }, [onAction]);

  const onFinal = (transcript: string) => {
    stopListening();
    setLastTranscript(transcript);
    handleProcessCommand(transcript);
  }

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    hasRecognitionSupport,
    error: recognitionError,
  } = useSpeechRecognition({ onTranscriptFinal: onFinal });


  useEffect(() => {
    if (open) {
      setLastTranscript("");
      setStatus("listening")
      startListening()
    } else {
      stopListening()
      setStatus("idle")
    }
  }, [open, startListening, stopListening])

  useEffect(() => {
    if(recognitionError) {
        setStatus('error');
        onAction?.({ success: false, message: `Speech recognition error: ${recognitionError}` });
    }
  }, [recognitionError, onAction])

  const handleMicClick = () => {
    if (isListening) {
      stopListening()
    } else {
      setStatus('listening');
      setLastTranscript("");
      startListening()
    }
  }
  
  const getStatusContent = () => {
    const currentTranscript = transcript || lastTranscript;
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
          description: `Analyzing your command: "${currentTranscript}"`,
        }
      case "success":
        return {
          icon: <CheckCircle className="size-12 text-green-500" />,
          title: "Success!",
          description: "Command executed successfully.",
        }
      case "error":
        return {
          icon: <XCircle className="size-12 text-destructive" />,
          title: "Error",
          description: `An error occurred.`,
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
            disabled={status === "processing"}
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
