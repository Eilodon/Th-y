import React from 'react';
import { Mic, Loader2, Volume2 } from 'lucide-react';
import { AppState } from '../types';

interface Props {
  state: AppState;
  onClick: () => void;
}

export const VoiceButton: React.FC<Props> = ({ state, onClick }) => {
  const isIdle = state === 'idle';
  const isListening = state === 'listening';
  const isProcessing = state === 'processing';
  const isSpeaking = state === 'speaking';

  return (
    <div className="relative">
      {/* Sonar Rings */}
      {isListening && (
        <>
          <div className="absolute inset-0 rounded-full border-2 border-orange-400 opacity-0 animate-pulse-ring" style={{ animationDelay: '0s' }}></div>
          <div className="absolute inset-0 rounded-full border-2 border-orange-400 opacity-0 animate-pulse-ring" style={{ animationDelay: '1s' }}></div>
        </>
      )}

      <button
        onClick={onClick}
        disabled={isProcessing}
        aria-label={isListening ? "Stop listening" : "Start meditation"}
        className={`
          relative z-10 w-36 h-36 rounded-full flex items-center justify-center transition-all duration-500
          ${isIdle ? 'bg-orange-500 hover:bg-orange-600 scale-100 hover:scale-105' : ''}
          ${isListening ? 'bg-red-500 scale-110 shadow-[0_0_40px_rgba(249,115,22,0.6)]' : ''}
          ${isProcessing ? 'bg-stone-300 scale-95 cursor-wait' : ''}
          ${isSpeaking ? 'bg-orange-400 scale-100' : ''}
        `}
      >
        {isIdle && <Mic className="w-12 h-12 text-white animate-pulse" />}
        {isListening && <div className="w-4 h-4 bg-white rounded-sm animate-bounce" />}
        {isProcessing && <Loader2 className="w-12 h-12 text-stone-500 animate-spin" />}
        {isSpeaking && <Volume2 className="w-12 h-12 text-white animate-pulse" />}
      </button>

      {/* Status Text */}
      <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 whitespace-nowrap text-center">
        <p className="text-stone-800 font-medium text-lg">
          {isIdle && "Nhấn để nói / Tap to speak"}
          {isListening && "Đang lắng nghe..."}
          {isProcessing && "Thầy đang suy nghĩ..."}
          {isSpeaking && "Thầy đang chia sẻ..."}
        </p>
      </div>
    </div>
  );
};