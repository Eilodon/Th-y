import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Brain, Zap, Activity } from 'lucide-react';
import { ZenResponse } from '../types';

interface Props {
  data: ZenResponse;
}

export const ReasoningPanel: React.FC<Props> = ({ data }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Fallback if reasoning isn't provided
  if (!data.reasoning_steps || data.reasoning_steps.length === 0) return null;

  return (
    <div className="w-full max-w-md mx-4 mt-4 transition-all duration-300 ease-in-out">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center gap-2 w-full py-2 text-xs font-medium text-stone-500 hover:text-orange-600 transition-colors uppercase tracking-widest"
      >
        {isOpen ? (
          <>Ẩn suy nghĩ <ChevronUp size={14} /></>
        ) : (
          <>Xem suy nghĩ của Thầy <ChevronDown size={14} /></>
        )}
      </button>

      {isOpen && (
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 mt-2 border border-stone-200 shadow-inner animate-[fadeIn_0.3s_ease-out]">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4 text-stone-700">
            <Brain size={16} className="text-orange-500" />
            <span className="font-semibold text-sm font-sans">Quy trình suy nghĩ (Reasoning)</span>
          </div>

          {/* Timeline */}
          <div className="relative pl-4 border-l-2 border-stone-200 space-y-6">
            {data.reasoning_steps.map((step, idx) => (
              <div 
                key={idx} 
                className="relative animate-[slideRight_0.4s_ease-out_forwards]"
                style={{ opacity: 0, animationDelay: `${idx * 150}ms` }}
              >
                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-orange-400 border-2 border-white shadow-sm" />
                <p className="text-sm text-stone-600 font-sans leading-relaxed">
                  <span className="font-bold text-stone-800 mr-1">{idx + 1}.</span>
                  {step}
                </p>
              </div>
            ))}
          </div>

          {/* Quantum Metrics */}
          {data.quantum_metrics && (
            <div className="mt-6 pt-4 border-t border-stone-200 grid grid-cols-3 gap-2">
               <MetricItem 
                 icon={<Activity size={14} />} 
                 label="Coherence" 
                 value={data.quantum_metrics.coherence} 
                 color="text-blue-500"
                 delay={500}
               />
               <MetricItem 
                 icon={<Zap size={14} />} 
                 label="Entanglement" 
                 value={data.quantum_metrics.entanglement} 
                 color="text-purple-500"
                 delay={600}
               />
               <MetricItem 
                 icon={<Brain size={14} />} 
                 label="Presence" 
                 value={data.quantum_metrics.presence} 
                 color="text-emerald-500"
                 delay={700}
               />
            </div>
          )}
          
          <div className="mt-4 text-[10px] text-right text-stone-400 italic">
             AI Confidence: {Math.round(data.confidence * 100)}%
          </div>
        </div>
      )}
    </div>
  );
};

const MetricItem = ({ icon, label, value, color, delay }: any) => (
  <div 
    className="flex flex-col items-center animate-[scaleIn_0.5s_ease-out_forwards]"
    style={{ opacity: 0, animationDelay: `${delay}ms` }}
  >
    <div className={`mb-1 ${color}`}>{icon}</div>
    <div className="relative w-10 h-10 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full -rotate-90">
        <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" className="text-stone-200 fill-none" />
        <circle 
          cx="20" cy="20" r="16" 
          stroke="currentColor" 
          strokeWidth="3" 
          className={`${color} fill-none transition-all duration-1000`}
          strokeDasharray="100"
          strokeDashoffset={100 - (value * 100)}
          strokeLinecap="round"
        />
      </svg>
      <span className="text-[10px] font-bold text-stone-600">{Math.round(value * 100)}</span>
    </div>
    <span className="text-[9px] uppercase tracking-wider text-stone-500 mt-1">{label}</span>
  </div>
);

// Add these keyframes to your global CSS or index.html style tag for best results,
// but they usually work in Tailwind contexts if added to standard utility layers.
// Since we can't edit CSS files directly here easily without bloating, standard animate- classes are used, 
// assuming custom keyframes for 'slideRight' and 'scaleIn' would be in a real config.
// Fallback: simple transition opacity is handled by the 'animate' property if config matches.
// We will rely on standard opacity transitions for simplicity in this specific constraint context if keyframes missing.
