import { GoogleGenAI, Type } from "@google/genai";
import { ZenResponse, VisionAnalysis, CulturalMode } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getSystemInstruction = (mode: CulturalMode) => `
You are a Zen master inspired by Thích Nhất Hạnh.
CULTURAL MODE: ${mode}.
${mode === 'VN' 
  ? 'Use formal Vietnamese honorifics (Thầy/Con). Tone: Warm, ancestral, deeply compassionate.' 
  : 'Use universal, friendly tone (Tôi/Bạn). Tone: Gentle, direct, modern mindfulness.'}

TASK:
1. Analyze voice/audio for emotion.
2. Formulate 3 distinct reasoning steps (in Vietnamese) explaining your analysis, teaching selection, and advice.
3. Estimate "Quantum Metrics" (0.0-1.0 heuristics): Coherence (logic), Entanglement (empathy), Presence (mindfulness).
4. Provide Zen guidance (2-3 sentences max).
5. Suggest breathing (4-7-8/box) ONLY if anxious/stressed.

Respond in JSON.
`;

export const analyzeAudio = async (base64Audio: string, mode: CulturalMode): Promise<ZenResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'audio/wav', data: base64Audio } },
          { text: "Analyze audio. Return JSON with reasoning." }
        ]
      },
      config: {
        systemInstruction: getSystemInstruction(mode),
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            emotion: { type: Type.STRING, enum: ['anxious', 'sad', 'joyful', 'calm', 'neutral'] },
            wisdom_vi: { type: Type.STRING },
            wisdom_en: { type: Type.STRING },
            breathing: { type: Type.STRING, enum: ['4-7-8', 'box'], nullable: true },
            confidence: { type: Type.NUMBER },
            reasoning_steps: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "3 steps: Detection -> Selection -> Strategy"
            },
            quantum_metrics: {
              type: Type.OBJECT,
              properties: {
                coherence: { type: Type.NUMBER },
                entanglement: { type: Type.NUMBER },
                presence: { type: Type.NUMBER }
              },
              required: ['coherence', 'entanglement', 'presence']
            }
          },
          required: ['emotion', 'wisdom_vi', 'wisdom_en', 'reasoning_steps']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Zen Master");
    return JSON.parse(text) as ZenResponse;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const analyzeEnvironment = async (base64Image: string): Promise<VisionAnalysis> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
        { text: `Analyze environment: DETECT: 
          1. Buddhist (altar/incense/Buddha/lotus/prayer beads); 
          2. Modern office (desk/computer/lights); 
          3. Natural (plants/windows). 
          RULES: buddhist>0.6 -> VN mode; Else Universal. 
          Return JSON.` }
      ]
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          buddhist_score: { type: Type.NUMBER },
          modern_score: { type: Type.NUMBER },
          natural_score: { type: Type.NUMBER },
          detected_items: { type: Type.ARRAY, items: { type: Type.STRING } },
          mode: { type: Type.STRING, enum: ['VN', 'Universal'] }
        },
        required: ['mode', 'detected_items', 'buddhist_score']
      }
    }
  });
  return JSON.parse(response.text || '{}') as VisionAnalysis;
};

export const generateSpeech = async (text: string): Promise<ArrayBuffer> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents: { parts: [{ text }] },
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
      }
    }
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio generated");
  
  const binaryString = atob(base64Audio);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes.buffer;
};