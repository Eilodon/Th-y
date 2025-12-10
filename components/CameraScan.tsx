import React, { useState, useRef } from 'react';
import { Camera, X, Check, Loader2, ScanEye } from 'lucide-react';
import { analyzeEnvironment } from '../services/geminiService';
import { CulturalMode } from '../types';

interface Props {
  onModeChange: (mode: CulturalMode, items: string[]) => void;
  currentMode: CulturalMode;
}

export const CameraScan: React.FC<Props> = ({ onModeChange, currentMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(s);
      setIsOpen(true);
    } catch (e) {
      alert("Camera denied. Using Universal mode.");
    }
  };

  const closeCamera = () => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    setIsOpen(false);
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current) return;
    setIsScanning(true);
    
    // Privacy: Local capture only
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(videoRef.current, 0, 0, 640, 480);
    
    const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
    
    try {
      const result = await analyzeEnvironment(base64);
      onModeChange(result.mode, result.detected_items);
      closeCamera();
    } catch (e) {
      console.error(e);
      alert("Vision failed. Try again.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <>
      <div className="absolute top-4 left-4 z-50 flex flex-col gap-2">
        <button 
          onClick={() => !isOpen && startCamera()}
          className={`p-3 rounded-full shadow-lg transition-all ${
            currentMode === 'VN' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
          }`}
          aria-label="Scan Environment"
        >
          <Camera size={20} />
        </button>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full text-center ${
           currentMode === 'VN' ? 'bg-amber-500 text-white' : 'bg-slate-500 text-white'
        }`}>
          {currentMode}
        </span>
      </div>

      {isOpen && (
        <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-stone-900 rounded-2xl overflow-hidden border border-stone-700">
            {!isScanning ? (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                onLoadedMetadata={() => videoRef.current?.play()}
                className="w-full h-64 object-cover" 
              />
            ) : (
              <div className="w-full h-64 flex items-center justify-center bg-stone-800">
                <ScanEye className="animate-pulse text-amber-500 w-16 h-16" />
              </div>
            )}
            
            <div className="p-4 flex flex-col gap-3">
              <p className="text-stone-300 text-sm text-center">
                Ảnh chỉ được phân tích cục bộ để nhận diện bối cảnh (Bàn thờ/Văn phòng). 
                Không lưu trữ ảnh.
              </p>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={closeCamera}
                  disabled={isScanning}
                  className="px-4 py-2 rounded-full bg-stone-700 text-white flex items-center gap-2"
                >
                  <X size={16} /> Hủy
                </button>
                <button 
                  onClick={captureAndAnalyze}
                  disabled={isScanning}
                  className="px-6 py-2 rounded-full bg-orange-600 text-white flex items-center gap-2 font-bold"
                >
                  {isScanning ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Quét
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};