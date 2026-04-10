import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';

interface UseInterviewSessionOptions {
  interviewId: string;
}

function splitIntoSentences(text: string): string[] {
  const sentences = text
    .replace(/([.!?])\s+/g, '$1|')
    .split('|')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  return sentences;
}

export function useInterviewSession(options: UseInterviewSessionOptions) {
  const { interviewId } = options;
  const wsRef = useRef<WebSocket | null>(null);
  const recognitionRef = useRef<any>(null);
  const speakingRef = useRef(false);
  const queueRef = useRef<string[]>([]);
  const autoListenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userSilenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [waitingForUser, setWaitingForUser] = useState(false);

  const user = useAuthStore((state) => state.user);

  const clearAllTimers = () => {
    if (autoListenTimerRef.current) {
      clearTimeout(autoListenTimerRef.current);
      autoListenTimerRef.current = null;
    }
    if (userSilenceTimerRef.current) {
      clearTimeout(userSilenceTimerRef.current);
      userSilenceTimerRef.current = null;
    }
  };

  const startListening = useCallback(() => {
    if (recognitionRef.current) return;
    
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const sr = new SR();
    sr.lang = 'fr-FR';
    sr.interimResults = false;
    sr.maxAlternatives = 1;

    sr.onstart = () => {
      setIsListening(true);
      setWaitingForUser(true);
      clearAllTimers();
    };

    sr.onresult = (e: any) => {
      const text = e.results[0][0].transcript.trim();
      if (text && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'text', content: text }));
      }
      
      if (userSilenceTimerRef.current) {
        clearTimeout(userSilenceTimerRef.current);
      }
      userSilenceTimerRef.current = setTimeout(() => {
        setWaitingForUser(false);
      }, 3000);
    };

    sr.onend = () => {
      recognitionRef.current = null;
      const wasListening = isListening;
      setIsListening(false);
      
      if (wasListening && speakingRef.current === false) {
        userSilenceTimerRef.current = setTimeout(() => {
          setWaitingForUser(false);
        }, 3000);
      }
    };

    sr.onerror = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };

    try {
      sr.start();
      recognitionRef.current = sr;
    } catch {}
  }, []);

  const stopListening = useCallback(() => {
    clearAllTimers();
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setWaitingForUser(false);
  }, []);

  const playNext = useCallback(() => {
    const synth = window.speechSynthesis;
    if (!synth || queueRef.current.length === 0) {
      speakingRef.current = false;
      setIsSpeaking(false);
      setWaitingForUser(false);
      
      autoListenTimerRef.current = setTimeout(() => {
        if (speakingRef.current === false) {
          startListening();
        }
      }, 2000);
      
      return;
    }

    const text = queueRef.current.shift()!;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.9;
    utterance.pitch = 1;

    const voices = synth.getVoices();
    const frenchVoice = voices.find(v => v.lang.startsWith('fr')) || 
                        voices.find(v => v.lang.includes('fr')) ||
                        voices[0];
    if (frenchVoice) {
      utterance.voice = frenchVoice;
    }

    utterance.onend = () => {
      if (queueRef.current.length > 0) {
        setTimeout(() => playNext(), 150);
      } else {
        speakingRef.current = false;
        setIsSpeaking(false);
        setWaitingForUser(false);
        
        autoListenTimerRef.current = setTimeout(() => {
          if (speakingRef.current === false) {
            startListening();
          }
        }, 2000);
      }
    };

    utterance.onerror = () => {
      if (queueRef.current.length > 0) {
        setTimeout(() => playNext(), 150);
      } else {
        speakingRef.current = false;
        setIsSpeaking(false);
        setWaitingForUser(false);
        
        autoListenTimerRef.current = setTimeout(() => {
          if (speakingRef.current === false) {
            startListening();
          }
        }, 2000);
      }
    };

    synth.speak(utterance);
  }, [startListening]);

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined') return;
    
    const synth = window.speechSynthesis;
    if (!synth) return;
    
    clearAllTimers();
    stopListening();
    
    synth.cancel();
    queueRef.current = splitIntoSentences(text);
    
    if (queueRef.current.length === 0) return;
    
    speakingRef.current = true;
    setIsSpeaking(true);
    setWaitingForUser(false);
    playNext();
  }, [playNext, stopListening]);

  const stopSpeaking = useCallback(() => {
    clearAllTimers();
    if (typeof window !== 'undefined') {
      const synth = window.speechSynthesis;
      if (synth) {
        synth.cancel();
      }
    }
    queueRef.current = [];
    speakingRef.current = false;
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const synth = window.speechSynthesis;
      if (synth) {
        synth.getVoices();
        synth.onvoiceschanged = () => {
          synth.getVoices();
        };
      }
    }
  }, []);

  useEffect(() => {
    if (!user?.id || !interviewId) return () => {};

    const ws = new WebSocket(`ws://localhost:3001/ws/interview?interviewId=${interviewId}&userId=${user.id}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({ type: 'start' }));
    };

    ws.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        if (d.type === 'welcome' || d.type === 'response') {
          speak(d.message);
        }
      } catch {}
    };

    ws.onclose = () => {
      setIsConnected(false);
      stopSpeaking();
      clearAllTimers();
    };

    return () => {
      clearAllTimers();
      stopListening();
      stopSpeaking();
      ws.close();
      wsRef.current = null;
    };
  }, [user?.id, interviewId, speak, stopSpeaking, stopListening]);

  const disconnect = useCallback(() => {
    clearAllTimers();
    stopListening();
    stopSpeaking();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, [stopListening, stopSpeaking]);

  return { 
    isConnected, 
    isListening, 
    isSpeaking,
    waitingForUser,
    startListening, 
    stopListening, 
    stopSpeaking, 
    disconnect 
  };
}
