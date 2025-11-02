"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

type SpeechRecognitionHook = {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  hasRecognitionSupport: boolean;
  error: string | null;
};

type UseSpeechRecognitionOptions = {
  onTranscriptFinal?: (transcript: string) => void;
};


export const useSpeechRecognition = ({ onTranscriptFinal }: UseSpeechRecognitionOptions = {}): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        setTranscript(transcript + finalTranscript + interimTranscript);

        if(finalTranscriptTimeoutRef.current){
            clearTimeout(finalTranscriptTimeoutRef.current);
        }

        if(finalTranscript){
            finalTranscriptTimeoutRef.current = setTimeout(() => {
                if(onTranscriptFinal){
                    onTranscriptFinal(finalTranscript.trim());
                }
                recognition.stop();
            }, 1000);
        }
    };

    recognition.onerror = (event) => {
      setError(event.error);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if(finalTranscriptTimeoutRef.current){
            clearTimeout(finalTranscriptTimeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, [onTranscriptFinal]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setError(null);
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch(e) {
        // Ignore "already started" error, as we have a guard.
        // This can happen in some race conditions with React's StrictMode.
        if((e as DOMException).name !== 'InvalidStateError') {
            setError((e as DOMException).message);
        }
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    hasRecognitionSupport: !!recognitionRef.current,
    error
  };
};
