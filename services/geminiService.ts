
import { GoogleGenAI, Modality } from "@google/genai";
import { Language, CrowdMetric } from "../types";

export interface GroundingLink {
  uri: string;
  title: string;
}

export interface ChatAIResponse {
  text: string;
  groundingLinks?: GroundingLink[];
  isGroundingActive?: boolean;
}

export interface EarlyWarningAnalysis {
  status: 'SAFE' | 'WARNING' | 'CRITICAL';
  anomalies: string[];
  reRoutingStrategy: string;
  paMessage: string;
  confidence: number;
}

// --- AUDIO PROCESSING HELPERS ---

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeRawPcmToBuffer(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

/**
 * Synthesizes text using Gemini 2.5 Flash TTS.
 */
const synthesizeTts = async (text: string, voiceName: string = 'Kore'): Promise<AudioBuffer | null> => {
  if (!process.env.API_KEY) return null;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Data) return null;

    return await decodeRawPcmToBuffer(
      decodeBase64(base64Data),
      audioCtx,
      24000,
      1
    );
  } catch (e) {
    console.error("TTS Synthesis Error:", e);
    return null;
  }
};

/**
 * Translates text using Gemini 3 Flash.
 */
const translateWithGemini = async (text: string, targetLang: string): Promise<string> => {
  if (!process.env.API_KEY) return text;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Translate the following temple alert to ${targetLang}. Return ONLY the translated text: "${text}"`,
    });
    return response.text || text;
  } catch (e) {
    console.error("Translation Error:", e);
    return text;
  }
};

// --- CORE AI SERVICES ---

export const analyzeCrowdSafety = async (metrics: CrowdMetric[]): Promise<EarlyWarningAnalysis> => {
  if (!process.env.API_KEY) {
    return {
      status: 'SAFE',
      anomalies: ['AI Offline'],
      reRoutingStrategy: 'Standard operating procedure.',
      paMessage: 'Please follow queue discipline.',
      confidence: 0.5
    };
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const metricsJson = JSON.stringify(metrics);

  const prompt = `
    Analyze live crowd metrics for Dwarakatirumala Temple: ${metricsJson}
    Predict potential anomalies: Bottlenecks, Stampede risks, or Gate overflows.
    Note: North Gate is ENTRY ONLY. South is Main Exit.
    
    Return status (SAFE/WARNING/CRITICAL), anomalies list, re-routing strategy, and PA announcement script.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      },
    });

    const text = response.text || "";
    const status: any = text.includes('CRITICAL') ? 'CRITICAL' : text.includes('WARNING') ? 'WARNING' : 'SAFE';
    
    return {
      status,
      anomalies: text.split('\n').filter(l => l.includes('-') || l.includes('•')).slice(0, 3),
      reRoutingStrategy: text.split('Strategy:')[1]?.split('Announcement:')[0]?.trim() || "Maintain current gate status.",
      paMessage: text.split('Announcement:')[1]?.trim() || "Pilgrims are advised to follow the queue complex markers.",
      confidence: 0.95
    };
  } catch (error) {
    console.error("Safety Analysis Error:", error);
    return { status: 'SAFE', anomalies: [], reRoutingStrategy: 'Normal', paMessage: 'Systems monitoring.', confidence: 0 };
  }
};

/**
 * Advanced PA Announcement System.
 * Automatically translates to Telugu and plays Telugu FIRST, then English.
 */
export const playPAAnnouncement = async (text: string, sourceLang: Language = Language.ENGLISH) => {
  console.log(`[PA SYSTEM] Sequential Alert Triggered: Telugu then English.`);
  
  let teluguText = "";
  let englishText = "";

  if (sourceLang === Language.TELUGU) {
    teluguText = text;
    englishText = await translateWithGemini(text, "English");
  } else {
    englishText = text;
    teluguText = await translateWithGemini(text, "Telugu");
  }

  const teluguBuffer = await synthesizeTts(teluguText);
  const englishBuffer = await synthesizeTts(englishText);

  const play = (buffer: AudioBuffer, delay: number = 0) => {
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start(audioCtx.currentTime + delay);
  };

  if (teluguBuffer) {
    play(teluguBuffer, 0);
    if (englishBuffer) {
      play(englishBuffer, teluguBuffer.duration + 0.5); // 0.5s pause
    }
  } else if (englishBuffer) {
    play(englishBuffer, 0);
  }
};

export const getChatResponse = async (
  message: string, 
  language: Language, 
  isOffline: boolean
): Promise<ChatAIResponse> => {
  if (isOffline || !process.env.API_KEY) {
    return { text: "Offline mode active. Dwarakatirumala timings: 4 AM - 10 PM." };
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const needsMaps = message.toLowerCase().includes('location') || message.toLowerCase().includes('where');

  const datasetPrompt = `You are DivyaSahayak for Dwarakatirumala Temple. Be concise and respectful.`;

  try {
    if (needsMaps) {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `${datasetPrompt}\nQuestion: ${message}`,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: { retrievalConfig: { latLng: { latitude: 16.9499, longitude: 81.2991 } } }
        },
      });
      const links = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.filter((c: any) => c.maps).map((c: any) => ({ uri: c.maps.uri, title: c.maps.title })) || [];
      return { text: response.text || "Dataset match.", groundingLinks: links, isGroundingActive: true };
    } else {
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: `${datasetPrompt}\nQuestion: ${message}`,
      });
      return { text: response.text || "Namaskaram.", isGroundingActive: false };
    }
  } catch (error) {
    return { text: "Systems momentarily busy. Please try again." };
  }
};

export const PA_TEMPLATES: Record<string, Record<Language, string>> = {
  CRITICAL_CROWD: {
    [Language.ENGLISH]: "Attention. High density at Queue Complex. Move slowly.",
    [Language.TELUGU]: "భక్తులారా గమనించండి. క్యూ కాంప్లెక్స్ వద్ద రద్దీ ఎక్కువగా ఉంది.",
    [Language.HINDI]: "ध्यान दें। कतार परिसर में भीड़ अधिक है।"
  },
  GATE_RULE: {
    [Language.ENGLISH]: "North Gopuram is for Entry Only. Please exit via South Raja Gopuram.",
    [Language.TELUGU]: "ఉత్తర గోపురం ప్రవేశానికి మాత్రమే. దక్షిణ రాజ గోపురం నుండి నిష్క్రమించండి.",
    [Language.HINDI]: "उत्तर गोपुरम केवल प्रवेश के लिए है। दक्षिण राजा గోపురం से बाहर निकलें।"
  }
};
