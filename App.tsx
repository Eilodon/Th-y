import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { VoiceButton } from './components/VoiceButton';
import { QuoteCard } from './components/QuoteCard';
import { CameraScan } from './components/CameraScan';
import { ReasoningPanel } from './components/ReasoningPanel';
import { AudioControl } from './components/AudioControl';
import { analyzeAudio, generateSpeech } from './services/geminiService';
import { initAudio, playAmbient, startBreathing, stopAudio } from './services/audioEngine';
import { AppState, ZenResponse, CulturalMode } from './types';

const OrbViz = React.lazy(() => import('./components/OrbViz'));

const SILENCE_THRESHOLD = 15;
const SILENCE_DURATION = 2000;

export default function App() {
  const [state, setState] = useState<AppState>('idle');
  const [zenData, setZenData] = useState<ZenResponse | null>(null);
  const [culturalMode, setCulturalMode] = useState<CulturalMode>('Universal');
  const [toast, setToast] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<number | null>(null);
  const lastSoundTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Load cache
  useEffect(() => {
    const cached = localStorage.getItem('thay_ai_mode');
    const expire = localStorage.getItem('thay_ai_expire');
    if (cached && expire && Date.now() < parseInt(expire)) {
      setCulturalMode(cached as CulturalMode);
    }
  }, []);

  const handleModeChange = (mode: CulturalMode, items: string[]) => {
    setCulturalMode(mode);
    localStorage.setItem('thay_ai_mode', mode);
    localStorage.setItem('thay_ai_expire', (Date.now() + 24 * 60 * 60 * 1000).toString());
    
    const itemsText = items.length > 0 ? `: ${items.slice(0, 2).join(', ')}` : '';
    setToast(`Phát hiện${itemsText} → Chế độ ${mode}`);
    setTimeout(() => setToast(null), 3000);
  };

  const initWebAudio = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    if (!analyserRef.current) {
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setState('processing');
    }
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
  }, []);

  const handleDataAvailable = useCallback(async (event: BlobEvent) => {
    if (event.data.size > 0) audioChunksRef.current.push(event.data);
  }, []);

  const handleStop = useCallback(async () => {
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        try {
          const analysis = await analyzeAudio(base64Audio, culturalMode);
          setZenData(analysis);
          
          // Trigger Audio Engine
          playAmbient(analysis.emotion);
          if (analysis.breathing) startBreathing(analysis.breathing);

          const audioBuffer = await generateSpeech(analysis.wisdom_vi);
          
          setState('speaking');
          if (audioContextRef.current && analyserRef.current) {
            const buffer = await audioContextRef.current.decodeAudioData(audioBuffer);
            const source = audioContextRef.current.createBufferSource();
            source.buffer = buffer;
            source.connect(analyserRef.current);
            analyserRef.current.connect(audioContextRef.current.destination);
            source.onended = () => setState('idle');
            source.start(0);
          }
        } catch (err) {
          console.error(err);
          setState('idle');
          alert("Could not connect to Zen Master.");
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (e) {
      console.error(e);
      setState('idle');
    }
  }, [culturalMode]);

  const startListening = async () => {
    try {
      await initWebAudio(); // Mic Context
      await initAudio(); // Tone.js Context
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = audioContextRef.current!;
      const source = audioCtx.createMediaStreamSource(stream);
      if (analyserRef.current) source.connect(analyserRef.current);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = handleDataAvailable;
      mediaRecorder.onstop = handleStop;
      mediaRecorder.start();

      setState('listening');
      setZenData(null);
      stopAudio(); // Silence ambient while listening
      
      lastSoundTimeRef.current = Date.now();

      const checkSilence = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        if (average > SILENCE_THRESHOLD) lastSoundTimeRef.current = Date.now();

        if (Date.now() - lastSoundTimeRef.current > SILENCE_DURATION) stopRecording();
        else animationFrameRef.current = requestAnimationFrame(checkSilence);
      };
      checkSilence();
    } catch (err) {
      alert("Microphone access required.");
      setState('idle');
    }
  };

  const bgClass = culturalMode === 'VN' 
    ? 'bg-gradient-to-br from-amber-50 to-orange-100' 
    : 'bg-gradient-to-br from-slate-50 to-indigo-100';

  return (
    <div className={`flex flex-col items-center justify-between min-h-screen overflow-hidden relative transition-colors duration-1000 ${bgClass}`}>
      
      <CameraScan onModeChange={handleModeChange} currentMode={culturalMode} />
      <AudioControl />
      
      {toast && (
        <div className="absolute top-20 z-50 bg-white/90 backdrop-blur px-6 py-2 rounded-full shadow-lg border border-orange-200 animate-[fadeIn_0.5s]">
          <p className="text-sm font-medium text-stone-700">{toast}</p>
        </div>
      )}

      <div className="absolute top-0 left-0 w-full h-[65vh] z-0">
        {state !== 'processing' && (
          <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-stone-300">Loading...</div>}>
            <OrbViz analyser={analyserRef.current} emotion={zenData?.emotion || 'neutral'} />
          </Suspense>
        )}
      </div>

      <div className="relative z-10 w-full flex flex-col items-center h-full pt-8 pointer-events-none">
        <div className="text-center opacity-60 mb-4">
          <h1 className="text-xl font-bold tracking-widest text-stone-400 uppercase">Thầy.AI</h1>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-end w-full max-w-lg pb-12 space-y-4">
        {zenData && state !== 'listening' && state !== 'processing' && (
          <div className="w-full flex flex-col items-center animate-[slideUp_0.5s_ease-out]">
             <QuoteCard data={zenData} />
             <ReasoningPanel data={zenData} />
          </div>
        )}
        <div className="pb-8 pt-4">
           <VoiceButton state={state} onClick={() => state === 'idle' ? startListening() : stopRecording()} />
        </div>
      </div>
    </div>
  );
}