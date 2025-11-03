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
  const onFinalCallbackRef = useRef(onTranscriptFinal);

  // Keep the callback ref updated
  useEffect(() => {
    onFinalCallbackRef.current = onTranscriptFinal;
  }, [onTranscriptFinal]);

  const handleResult = useCallback((event: SpeechRecognitionEvent) => {
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      }
    }

    if (finalTranscript && onFinalCallbackRef.current) {
      onFinalCallbackRef.current(finalTranscript.trim());
    }
  }, []);

  const handleEnd = useCallback(() => {
    setIsListening(false);
    setTranscript('');
    if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
    }
  }, []);

  const handleError = useCallback((event: SpeechRecognitionErrorEvent) => {
    setError(event.error);
    console.error(`Speech recognition error: ${event.error}`);
    handleEnd();
  }, [handleEnd]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser.');
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;
    recognition.continuous = false; // Set to false to stop after a pause
    recognition.interimResults = false; // We only care about the final result
    recognition.lang = 'en-US';

    return () => {
      if (recognition) {
        recognition.abort();
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
          console.error("Speech recognition start error: ", e);
          setError((e as DOMException).message);
        }
      }
    }
  }, [isListening, handleResult, handleEnd, handleError]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      handleEnd();
    }
  }, [isListening, handleEnd]);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    hasRecognitionSupport: !!(typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)),
    error,
  };
};
