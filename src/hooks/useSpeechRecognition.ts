import { useState, useCallback, useRef, useEffect } from 'react';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useSpeechRecognition(onResult: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const onResultRef   = useRef(onResult);

  useEffect(() => { onResultRef.current = onResult; }, [onResult]);

  const supported =
    typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  const start = useCallback(() => {
    if (!supported) return;
    if (recognitionRef.current) return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR();
    recognitionRef.current = r;

    r.continuous      = false;
    r.interimResults  = true;
    r.lang            = 'en-IN';
    r.maxAlternatives = 1;

    r.onstart = () => setIsListening(true);

    r.onresult = (e: any) => {
      let text = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      onResultRef.current(text);
    };

    r.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    r.onerror = (e: any) => {
      console.warn('Speech recognition error:', e.error);
      setIsListening(false);
      recognitionRef.current = null;
    };

    try {
      r.start();
    } catch {
      setIsListening(false);
      recognitionRef.current = null;
    }
  }, [supported]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  return { isListening, start, stop, supported };
}
