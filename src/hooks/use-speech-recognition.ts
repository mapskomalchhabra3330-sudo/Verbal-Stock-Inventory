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

  const handleResult = useCallback((event: SpeechRecognitionEvent) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    
    setTranscript(finalTranscript + interimTranscript);

    if (finalTranscript && onTranscriptFinal) {
      onTranscriptFinal(finalTranscript.trim());
      if(recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
  }, [onTranscriptFinal]);

  const handleEnd = useCallback(() => {
    setIsListening(false);
    setTranscript('');
  }, []);

  const handleError = useCallback((event: SpeechRecognitionErrorEvent) => {
    setError(event.error);
  }, []);

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

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      const recognition = recognitionRef.current;
      setTranscript('');
      setError(null);

      recognition.onresult = handleResult;
      recognition.onend = handleEnd;
      recognition.onerror = handleError;

      try {
        recognition.start();
        setIsListening(true);
      } catch (e) {
        if ((e as DOMException).name !== 'InvalidStateError') {
          setError((e as DOMException).message);
        }
      }
    }
  }, [isListening, handleResult, handleEnd, handleError]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      // onend will handle the state change
    }
  }, [isListening]);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    hasRecognitionSupport: !!recognitionRef.current,
    error,
  };
};
