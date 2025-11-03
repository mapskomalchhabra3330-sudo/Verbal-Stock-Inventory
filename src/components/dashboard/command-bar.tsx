"use client"

import { useState, useCallback, useRef, useEffect } from 'react'
import { Mic, Send, Bot, User, CornerDownLeft, BrainCircuit, X } from 'lucide-react'
import { useAuth, useUser } from '@/firebase'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useSpeechRecognition } from '@/hooks/use-speech-recognition'
import { processVoiceCommand } from '@/lib/actions'
import type { VoiceCommandResponse } from '@/lib/types'
import { ScrollArea } from '../ui/scroll-area'
import { cn } from '@/lib/utils'

type Message = {
  id: string
  text: string
  sender: 'user' | 'bot'
  isProcessing?: boolean
}

export function CommandBar() {
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState<Message[]>([
      { id: 'bot-initial', text: 'Hello! How can I help you manage your inventory today?', sender: 'bot' }
  ])
  const [isOpen, setIsOpen] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const { user } = useUser();

  const handleAction = useCallback((response: VoiceCommandResponse) => {
    const { action, data, success, message } = response;
    
    setMessages(prev => prev.map(m => m.isProcessing ? { ...m, isProcessing: false, text: message } : m));

    if (success) {
      if (action?.startsWith('REFRESH')) {
        window.dispatchEvent(new Event('datachange'));
      }
    }
  }, []);
  
  const processCommand = useCallback(async (command: string) => {
    if (!command.trim() || !user) return

    const userMessageId = `user-${Date.now()}`
    const botMessageId = `bot-${Date.now()}`
    
    setMessages(prev => [
      ...prev,
      { id: userMessageId, text: command, sender: 'user' },
      { id: botMessageId, text: 'Processing...', sender: 'bot', isProcessing: true },
    ])
    setInputValue('')
    
    try {
      const result = await processVoiceCommand(user.uid, command)
      handleAction(result);
      if (result.action?.startsWith('OPEN_')) {
         window.dispatchEvent(new CustomEvent('voiceaction', { detail: result }));
      }
    } catch (e) {
      console.error(e)
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.'
      setMessages(prev => prev.map(m => m.id === botMessageId ? { ...m, text: errorMessage, isProcessing: false } : m))
    }
  }, [handleAction, user])
  
  const onFinal = useCallback((transcript: string) => {
    stopListening()
    processCommand(transcript)
  },[processCommand]);

  const {
    isListening,
    startListening,
    stopListening,
    hasRecognitionSupport,
  } = useSpeechRecognition({ onTranscriptFinal: onFinal })
  
  useEffect(() => {
    if (isOpen && scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages, isOpen])

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
       setMessages(prev => prev.map(m => m.text === 'Listening...' ? { ...m, text: 'Hello! How can I help you manage your inventory today?' } : m));
      setMessages(prev => [...prev, { id: `bot-${Date.now()}`, text: 'Listening...', sender: 'bot' }]);
    }
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button size="icon" className="rounded-full w-16 h-16 shadow-lg" onClick={() => setIsOpen(true)}>
          <Bot className="w-8 h-8" />
        </Button>
      </div>
    )
  }
  
  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm">
      <div className="relative rounded-lg border bg-card text-card-foreground shadow-xl transition-all h-[600px] flex flex-col">
        <div className="flex items-center justify-between border-b p-3">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-full border bg-background">
                    <Bot className="size-6 text-primary"/>
                </div>
                <div>
                    <h3 className="font-semibold text-lg">Command Assistant</h3>
                    <p className="text-sm text-muted-foreground">Your AI inventory partner</p>
                </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="size-5" />
            </Button>
        </div>
        <ScrollArea className="flex-1 p-3" ref={scrollAreaRef}>
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
        <form onSubmit={handleFormSubmit} className="relative p-3 border-t">
          <Textarea
            placeholder={isListening ? "Listening..." : "Type a command or use the mic..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleFormSubmit(e as any);
              }
               if (e.key === 'Escape') {
                setIsOpen(false);
              }
            }}
            className="min-h-[48px] resize-none pr-20"
            readOnly={isListening}
            disabled={!user}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {hasRecognitionSupport && (
              <Button type="button" size="icon" variant={isListening ? "destructive" : "ghost"} onClick={handleMicClick} disabled={!hasRecognitionSupport || !user}>
                <Mic className="size-5" />
              </Button>
            )}
            <Button type="submit" size="icon" disabled={!inputValue.trim() || isListening || !user}>
              <CornerDownLeft className="size-5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
