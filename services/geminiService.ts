import { GoogleGenAI } from "@google/genai";
import { Language, CrowdMetric } from "../types";

// --- KNOWLEDGE BASE FOR DWARAKATIRUMALA (CHINNA TIRUPATHI) ---
const TEMPLE_KNOWLEDGE = [
  {
    keywords: ['location', 'where', 'place', 'eluru', 'district', 'village'],
    response: "Sri Venkateswara Swamy Vari Devasthanam is located in Dwarakatirumala Village/Mandal, Eluru District, Andhra Pradesh. Coordinates: 16.9499° N, 81.2991° E."
  },
  {
    keywords: ['darshan', 'timing', 'open', 'close', 'hours', 'time', 'peak'],
    response: "General Darshan timings are from 4:00 AM to 10:00 PM. Peak hours are typically 8:00 AM to 1:30 PM. Please plan accordingly to avoid long wait times."
  },
  {
    keywords: ['gate', 'entry', 'exit', 'gopuram', 'south', 'north', 'east', 'west'],
    response: "Gate Access:\n1. South Raja Gopuram (Main Entry/Exit)\n2. East Gopuram\n3. West Gopuram\n4. North Gopuram (Entry ONLY).\nPlease follow the one-way flow system."
  },
  {
    keywords: ['annadanam', 'food', 'meal', 'lunch'],
    response: "Free Annadanam is served daily at the dedicated Annadanam Hall. Follow signs from the core temple area."
  },
  {
    keywords: ['hair', 'tonsure', 'kesakandana', 'shave'],
    response: "Kesakandana Sala (Tonsuring facility) is located near the main queue complex. Tickets and tokens are available at the entrance."
  },
  {
    keywords: ['parking', 'vehicle', 'car', 'bus', 'road'],
    response: "Parking is available in designated areas near the temple roads. CCTV coverage (Hikvision 4MP) monitors all parking lots for safety."
  },
  {
    keywords: ['emergency', 'medical', 'aid', 'first aid', 'doctor'],
    response: "Medical First Aid support is available near the administrative zone. For emergencies, contact the main Control Room immediately."
  },
  {
    keywords: ['gosala', 'cow', 'animal'],
    response: "The Devasthanam maintains a Gosala which is open for devotee visits. It is located slightly away from the core temple area."
  },
  {
    keywords: ['hi', 'hello', 'namaste', 'namaskaram', 'start'],
    response: "Namaskaram! 🙏 I am DivyaSahayak, the intelligent assistant for Dwarakatirumala (Chinna Tirupati). How can I help you with Darshan, Amenities, or Safety today?"
  }
];

export const PA_TEMPLATES = {
  CRITICAL_CROWD: "Attention devotees at Dwarakatirumala. High density detected in the Queue Complex. Please maintain order and move slowly.",
  GATE_DIVERSION: "Devotees, please note: North Gopuram is for Entry Only. For exit, please move towards South Raja Gopuram or East Gopuram.",
  EMERGENCY_CLEAR: "Emergency Alert. Clear the central corridor for medical support vehicle movement immediately.",
  LOST_CHILD: "Announcement: A child has been found near Kesakandana Sala. Please report to the Enquiry Counter.",
  PEAK_ADVISORY: "Advisory: We are currently in the peak period (8:00 AM - 1:30 PM). Expect wait times of 90+ minutes."
};

// Fix: Define the missing OptimizationSuggestion interface
export interface OptimizationSuggestion {
  id: string;
  type: string;
  action: string;
  reason: string;
  impact: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

const OPTIMIZATION_STRATEGIES = {
  CRITICAL: [
    { id: 'c1', type: 'GATE', action: "Divert to East Gopuram", reason: "South Raja Gopuram Congestion > 85%", impact: "Balance load across gates", priority: 'HIGH' },
    { id: 'c2', type: 'STAFF', action: "Deploy Stampede Prevention Drill", reason: "Density Anomaly at Queue Entry", impact: "Ensure pilgrim safety", priority: 'HIGH' }
  ],
  MODERATE: [
    { id: 'm1', type: 'STAFF', action: "Activate Additional Counters", reason: "Wait time exceeding 45 mins", impact: "Reduce queue length", priority: 'MEDIUM' }
  ],
  NORMAL: [
    { id: 'n1', type: 'GATE', action: "Standard Gate Operations", reason: "Flow is optimal", impact: "Maintain efficiency", priority: 'LOW' }
  ]
};

export const getChatResponse = async (message: string, language: Language, isOffline: boolean): Promise<string> => {
  if (!isOffline && process.env.API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `User: "${message}". Dwarakatirumala context. Gates: South Raja, East, West, North(Entry). Peak: 8am-1:30pm.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { systemInstruction: "You are DivyaSahayak for Dwarakatirumala. Be brief, helpful, and culturally respectful." }
      });
      if (response.text) return response.text;
    } catch (e) { console.warn("Gemini Error", e); }
  }
  let lower = message.toLowerCase();
  let found = TEMPLE_KNOWLEDGE.find(k => k.keywords.some(kw => lower.includes(kw)));
  return found ? found.response : "I can help with Dwarakatirumala Darshan, Gopuram gates, and amenities. Could you be more specific?";
};

export const analyzeCrowdData = async (metrics: CrowdMetric[]): Promise<string> => {
  const max = Math.max(...metrics.map(m => m.density));
  if (max > 85) return "🔴 CRITICAL: South Raja Gopuram bottleneck. Divert new arrivals to East Gate.";
  if (max > 65) return "⚠ MODERATE: Increasing flow at Kesakandana Sala. Deploy extra volunteers.";
  return "✓ NORMAL: Crowd flow within safe limits for Chinna Tirupathi.";
};

// Fix: Use the exported OptimizationSuggestion interface for type safety
export const getOptimizationRecommendations = (metrics: CrowdMetric[]): OptimizationSuggestion[] => {
  const avg = metrics.reduce((acc, m) => acc + m.density, 0) / (metrics.length || 1);
  if (avg > 75) return OPTIMIZATION_STRATEGIES.CRITICAL as OptimizationSuggestion[];
  if (avg > 50) return OPTIMIZATION_STRATEGIES.MODERATE as OptimizationSuggestion[];
  return OPTIMIZATION_STRATEGIES.NORMAL as OptimizationSuggestion[];
};

export const playPAAnnouncement = (text: string) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
};
