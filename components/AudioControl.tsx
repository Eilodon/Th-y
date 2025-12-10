import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { setMute, initAudio } from '../services/audioEngine';

export const AudioControl: React.FC = () => {
  const [isMuted, setIsMuted] = useState(false);

  const handleToggle = () => {
    // Ensure context is running on interaction
    initAudio().then(() => {
      const newState = !isMuted;
      setIsMuted(newState);
      setMute(newState);
    });
  };

  return (
    <button 
      onClick={handleToggle}
      className="absolute top-4 right-4 z-50 p-3 rounded-full bg-white/20 backdrop-blur-sm text-stone-600 hover:bg-white/40 transition-colors shadow-sm"
      aria-label={isMuted ? "Unmute audio" : "Mute audio"}
    >
      {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
    </button>
  );
};