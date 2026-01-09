
import { GoogleGenAI, Modality } from "@google/genai";
import { Language, CrowdMetric, ProposedAlert, AlertSeverity, AdvisoryCategory, TacticalStep } from "../types";

const PLAYBOOK_TEMPLATES: Record<AdvisoryCategory, string[]> = {
  CONGESTION: [
    "Open alternate gate (North Gopuram)",
    "Pause new entry for 5 minutes",
    "Dispatch 5 additional volunteers to Zone Alpha",
    "Make PA announcement for slow movement"
  ],
  EMERGENCY: [
    "Clear primary medical exit route",
    "Notify District Police QR Team",
    "Broadcast emergency evacuation loop",
    "Activate backup lighting in all tunnels"
  ],
  DARSHAN_PAUSE: [
    "Seal sanctum entrance cordons",
    "Activate cooling fans in Queue Hall 4",
    "Deploy 'Water Distribution' team to stalled queues",
    "Update wait-time on digital signboards"
  ],
  ROUTE_GUIDE: [
    "Deploy signage team to South Junction",
    "Update mobile app waypoints",
    "Divert exit-bound pilgrims to Gate 4",
    "Monitor secondary flow bottleneck"
  ]
};

const getPlaybookFor = (category: AdvisoryCategory): TacticalStep[] => {
  return (PLAYBOOK_TEMPLATES[category] || PLAYBOOK_TEMPLATES.CONGESTION).map((instr, idx) => ({
    id: `step-${idx}`,
    instruction: instr,
    isCompleted: false
  }));
};

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
  proposedAlert?: ProposedAlert;
  isFallback?: boolean;
}

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
    return text;
  }
};

const heuristicAnalysis = (metrics: CrowdMetric[]): EarlyWarningAnalysis => {
  const criticalMetric = metrics.find(m => m.density > 80);
  const moderateMetric = metrics.find(m => m.density > 50);

  if (criticalMetric) {
    return {
      status: 'CRITICAL',
      anomalies: [`High Density Anomaly in ${criticalMetric.zoneName}`],
      reRoutingStrategy: `Immediately divert pilgrims from ${criticalMetric.zoneName} to alternate gates.`,
      paMessage: `Attention. High density at ${criticalMetric.zoneName}. Please follow staff instructions.`,
      confidence: 0.85,
      isFallback: true,
      proposedAlert: {
        id: 'fallback-' + Date.now(),
        category: 'EMERGENCY',
        severity: 'CRITICAL',
        message: `EMERGENCY: Density breach in ${criticalMetric.zoneName}. Immediate mobilization required.`,
        status: 'PENDING',
        timestamp: new Date(),
        playbookSteps: getPlaybookFor('EMERGENCY')
      }
    };
  }

  if (moderateMetric) {
    return {
      status: 'WARNING',
      anomalies: [`Load increase in ${moderateMetric.zoneName}`],
      reRoutingStrategy: `Monitor ${moderateMetric.zoneName} and slow down entry flow.`,
      paMessage: `Density rising in ${moderateMetric.zoneName}. Move slowly.`,
      confidence: 0.75,
      isFallback: true,
      proposedAlert: {
        id: 'fallback-' + Date.now(),
        category: 'CONGESTION',
        severity: 'WARNING',
        message: `Warning: Congestion detected in ${moderateMetric.zoneName}.`,
        status: 'PENDING',
        timestamp: new Date(),
        playbookSteps: getPlaybookFor('CONGESTION')
      }
    };
  }

  return {
    status: 'SAFE',
    anomalies: [],
    reRoutingStrategy: 'All zones operating within nominal parameters.',
    paMessage: 'Have a pleasant darshan.',
    confidence: 1.0,
    isFallback: true
  };
};

export const analyzeCrowdSafety = async (metrics: CrowdMetric[]): Promise<EarlyWarningAnalysis> => {
  if (!process.env.API_KEY) return heuristicAnalysis(metrics);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const metricsJson = JSON.stringify(metrics);

  const prompt = `
    Analyze live crowd metrics for Dwarakatirumala Temple: ${metricsJson}
    Predict anomalies (Stampede/Bottleneck).
    Return a JSON response with:
    {
      "status": "SAFE" | "WARNING" | "CRITICAL",
      "anomalies": string[],
      "reRoutingStrategy": string,
      "paMessage": string,
      "proposedAlert": {
        "category": "CONGESTION" | "EMERGENCY" | "ROUTE_GUIDE",
        "severity": "INFO" | "WARNING" | "CRITICAL",
        "message": "Instruction for staff/volunteers"
      }
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: "application/json"
      },
    });

    const res = JSON.parse(response.text || "{}");
    
    return {
      status: res.status || 'SAFE',
      anomalies: res.anomalies || [],
      reRoutingStrategy: res.reRoutingStrategy || "Maintain discipline.",
      paMessage: res.paMessage || "Follow queue lines.",
      confidence: 0.95,
      proposedAlert: res.proposedAlert ? {
        id: Math.random().toString(36).substr(2, 9),
        status: 'PENDING',
        timestamp: new Date(),
        ...res.proposedAlert,
        playbookSteps: getPlaybookFor(res.proposedAlert.category)
      } : undefined
    };
  } catch (error: any) {
    if (error.status === 429 || (error.message && error.message.includes('429'))) {
      console.warn("Gemini Quota Exceeded. Falling back to Heuristic Engine.");
      return heuristicAnalysis(metrics);
    }
    console.error("Safety Analysis Error:", error);
    return heuristicAnalysis(metrics);
  }
};

export const playPAAnnouncement = async (text: string, sourceLang: Language = Language.ENGLISH) => {
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
      play(englishBuffer, teluguBuffer.duration + 0.5);
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
      return { text: response.text || "Map details found.", groundingLinks: links, isGroundingActive: true };
    } else {
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: `${datasetPrompt}\nQuestion: ${message}`,
      });
      return { text: response.text || "Namaskaram.", isGroundingActive: false };
    }
  } catch (error) {
    return { text: "Systems momentarily busy." };
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
    [Language.HINDI]: "उत्तर गोपुरम केवल प्रवेश के लिए है। दक्षिण राजा గోपुरम से बाहर निकलें।"
  }
};
