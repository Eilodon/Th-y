export interface QuantumMetrics {
  coherence: number;
  entanglement: number;
  presence: number;
}

export interface ZenResponse {
  emotion: 'anxious' | 'sad' | 'joyful' | 'calm' | 'neutral';
  wisdom_vi: string;
  wisdom_en: string;
  breathing: '4-7-8' | 'box' | null;
  confidence: number;
  reasoning_steps: string[];
  quantum_metrics?: QuantumMetrics;
}

export type AppState = 'idle' | 'listening' | 'processing' | 'speaking';
export type CulturalMode = 'VN' | 'Universal';

export interface VisionAnalysis {
  buddhist_score: number;
  modern_score: number;
  natural_score: number;
  detected_items: string[];
  mode: CulturalMode;
}