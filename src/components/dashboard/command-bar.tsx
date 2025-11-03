"use client"

import { useState, useCallback, useRef, useEffect } from 'react'
import { Mic, Send, Bot, User, CornerDownLeft, BrainCircuit } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useSpeechRecognition } from '@/hooks/use-speech-recognition'
import { processVoiceCommand } from '@/lib/actions'
import type { VoiceCommandResponse } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { ScrollArea } from '../ui/scroll-area'
import { cn } from '@/lib/utils'

type Message = {
  id: string
  text: string
  sender: 'user' | 'bot'
  isProcessing?: boolean
}

export function CommandBar() {
  const { toast } = useToast()
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const handleAction = useCallback((response: VoiceCommandResponse) => {
    const { action, data, success, message } = response;
    
    setMessages(prev => prev.map(m => m.isProcessing ? { ...m, isProcessing: false, text: message } : m));

    if (success) {
      if (action) {
        toast({ title: "Success", description: message });
      }
      if (action?.startsWith('REFRESH')) {
        window.dispatchEvent(new Event('datachange'));
      }
    } else {
        toast({ variant: "destructive", title: "Error", description: message });
    }
  }, [toast]);
  
  const processCommand = useCallback(async (command: string) => {
    if (!command.trim()) return

    const userMessageId = `user-${Date.now()}`
    const botMessageId = `bot-${Date.now()}`
    
    setMessages(prev => [
      ...prev,
      { id: userMessageId, text: command, sender: 'user' },
      { id: botMessageId, text: 'Processing...', sender: 'bot', isProcessing: true },
    ])
    setInputValue('')
    
    try {
      const result = await processVoiceCommand(command)
      handleAction(result);
      if (result.action?.startsWith('OPEN_')) {
         window.dispatchEvent(new CustomEvent('voiceaction', { detail: result }));
      }
    } catch (e) {
      console.error(e)
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.'
      setMessages(prev => prev.map(m => m.id === botMessageId ? { ...m, text: errorMessage, isProcessing: false } : m))
      toast({ variant: "destructive", title: "Error", description: errorMessage });
    }
  }, [handleAction, toast])
  
  const onFinal = useCallback((transcript: string) => {
    stopListening()
    setIsExpanded(true); // Keep it expanded after speech
    processCommand(transcript)
  },[processCommand]);

  const {
    isListening,
    startListening,
    stopListening,
    hasRecognitionSupport,
  } = useSpeechRecognition({ onTranscriptFinal: onFinal })
  
  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages])

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    processCommand(inputValue)
  }

  const handleMicClick = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
      setInputValue('');
      setMessages(prev => [...prev, { id: `bot-${Date.now()}`, text: 'Listening...', sender: 'bot' }]);
    }
  }

  const handleTextareaFocus = () => {
    setIsExpanded(true);
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm">
      <div className="relative rounded-lg border bg-card text-card-foreground shadow-xl transition-all">
        {isExpanded && (
          <div className="border-b">
            <div className="p-3">
              <h3 className="font-semibold text-lg">Command Assistant</h3>
              <p className="text-sm text-muted-foreground">Ask me to manage your inventory.</p>
            </div>
            <ScrollArea className="h-64 p-3" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map(msg => (
                  <div key={msg.id} className={cn("flex items-start gap-3", msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
                     {msg.sender === 'bot' && (
                        <div className="p-2 rounded-full border bg-background">
                            {msg.isProcessing ? <BrainCircuit className="size-5 animate-spin text-primary" /> : <Bot className="size-5 text-primary"/>}
                        </div>
                     )}
                    <div className={cn("max-w-[75%] rounded-lg p-3 text-sm", msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                      {msg.text}
                    </div>
                     {msg.sender === 'user' && (
                        <div className="p-2 rounded-full border bg-background">
                           <User className="size-5" />
                        </div>
                     )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
        <form onSubmit={handleFormSubmit} className="relative p-3">
          <Textarea
            placeholder={isListening ? "Listening..." : "Type a command or use the mic..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={handleTextareaFocus}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleFormSubmit(e as any);
              }
               if (e.key === 'Escape') {
                setIsExpanded(false);
              }
            }}
            className={cn(
                "min-h-[48px] resize-none pr-20",
                isExpanded ? 'h-20' : 'h-12'
            )}
            readOnly={isListening}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {hasRecognitionSupport && (
              <Button type="button" size="icon" variant={isListening ? "destructive" : "ghost"} onClick={handleMicClick} disabled={!hasRecognitionSupport}>
                <Mic className="size-5" />
              </Button>
            )}
            <Button type="submit" size="icon" disabled={!inputValue.trim() || isListening}>
              <CornerDownLeft className="size-5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
