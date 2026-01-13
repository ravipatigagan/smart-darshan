
import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, Volume2, MapPin, Database, MessageSquare, Sparkles, Languages, Loader2, VolumeX, History, StopCircle } from 'lucide-react';
import { ChatMessage, Language } from '../types';
import { getChatResponse, GroundingLink, synthesizeTts, translateWithGemini } from '../services/geminiService';

interface ExtendedChatMessage extends ChatMessage {
  groundingLinks?: GroundingLink[];
  isGroundingActive?: boolean;
}

const PLACEHOLDERS: Record<Language, string> = {
  [Language.ENGLISH]: "Ask in English, Telugu, or Hindi...",
  [Language.TELUGU]: "తెలుగు, ఇంగ్లీష్ లేదా హిందీలో అడగండి...",
  [Language.HINDI]: "हिंदी, अंग्रेजी या तेलुगु में पूछें..."
};

interface DevoteeAssistantProps {
  activeLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

export const DevoteeAssistant: React.FC<DevoteeAssistantProps> = ({ activeLanguage, onLanguageChange }) => {
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Namaskaram. I am DivyaSahayak, your unified temple assistant. How can I help you today?",
      timestamp: new Date(),
      language: Language.ENGLISH
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(true);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isTranslatingHistory, setIsTranslatingHistory] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const recognitionRef = useRef<any>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  // Initialize ref with 'welcome' to prevent automatic speech on initial mount
  const lastModelMsgIdRef = useRef<string | null>('welcome');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle auto-speech when a new model message arrives
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (
      lastMsg && 
      lastMsg.role === 'model' && 
      isVoiceMode && 
      lastMsg.id !== lastModelMsgIdRef.current &&
      lastMsg.id !== 'welcome' // Double-check safety for welcome message
    ) {
      lastModelMsgIdRef.current = lastMsg.id;
      // Immediate trigger for auto-playback
      playSpeech(lastMsg.text);
    }
  }, [messages, isVoiceMode]);

  // Click outside listener for language menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsRecording(false);
        handleSend(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  // Update recognition language immediately when active language changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = activeLanguage === Language.TELUGU ? 'te-IN' : activeLanguage === Language.HINDI ? 'hi-IN' : 'en-IN';
    }
  }, [activeLanguage]);

  const handleLangSelect = async (newLang: Language) => {
    if (newLang === activeLanguage) {
      setIsLangMenuOpen(false);
      return;
    }
    
    setIsLangMenuOpen(false);
    setIsTranslatingHistory(true);
    onLanguageChange(newLang);

    // Warm up audio context
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    try {
      // PERSISTENT CONTEXT: Translate history to the new active language
      const translatedMessages = await Promise.all(messages.map(async (msg) => {
        const translatedText = await translateWithGemini(msg.text, newLang);
        return { ...msg, text: translatedText, language: newLang };
      }));
      setMessages(translatedMessages);
    } catch (e) {
      console.error("Language Sync Failed:", e);
    } finally {
      setIsTranslatingHistory(false);
    }
  };

  const playSpeech = async (text: string) => {
    if (isSynthesizing) return;
    setIsSynthesizing(true);
    
    try {
      // Direct speech synthesis based on locked language
      const buffer = await synthesizeTts(text, activeLanguage);
      if (buffer) {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        
        if (audioCtxRef.current.state === 'suspended') {
          await audioCtxRef.current.resume();
        }

        const source = audioCtxRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtxRef.current.destination);
        source.start();
        source.onended = () => setIsSynthesizing(false);
      } else {
        setIsSynthesizing(false);
      }
    } catch (err) {
      console.error("TTS Playback Error:", err);
      setIsSynthesizing(false);
    }
  };

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || inputText;
    if (!textToSend.trim()) return;

    // Strict input language enforcement
    const userMsg: ExtendedChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date(),
      language: activeLanguage
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Pass history for context and strictly enforce activeLanguage
      const result = await getChatResponse(userMsg.text, activeLanguage, false, messages);
      
      const aiMsg: ExtendedChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: result.text,
        timestamp: new Date(),
        language: activeLanguage,
        groundingLinks: result.groundingLinks,
        isGroundingActive: result.isGroundingActive
      };
      
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error("Chat Response Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      if (recognitionRef.current) {
        if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
        setIsRecording(true);
        recognitionRef.current.start();
      } else {
        alert("Speech recognition not supported in this browser.");
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative">
      {/* Header */}
      <div className="bg-slate-900 p-5 flex justify-between items-center text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-orange-600 p-2 rounded-xl shadow-lg">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest">DivyaSahayak AI</h1>
            <p className="text-[8px] opacity-60 font-bold tracking-tighter flex items-center gap-1 uppercase">
              <Database size={10} /> {activeLanguage} Command Hub
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsVoiceMode(!isVoiceMode)}
            className={`p-2.5 rounded-xl border transition-all ${isVoiceMode ? 'bg-orange-600 border-orange-500' : 'bg-white/10 border-white/10 hover:bg-white/20'}`}
            title="Auto-Speech Dispatch"
          >
            {isVoiceMode ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          
          <div className="relative" ref={langMenuRef}>
            <button 
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-xl border border-white/10 transition-all"
            >
              <Languages size={14} className="text-orange-400" />
              <span className="text-[10px] font-black uppercase">{activeLanguage.slice(0, 3)}</span>
            </button>
            {isLangMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {(Object.values(Language) as Language[]).map(lang => (
                  <button 
                    key={lang}
                    onClick={() => handleLangSelect(lang)}
                    className={`w-full text-left px-4 py-2.5 text-[10px] font-black uppercase transition-colors hover:bg-slate-50 ${activeLanguage === lang ? 'text-orange-600 bg-orange-50' : 'text-slate-600'}`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide relative">
        {isTranslatingHistory && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-40 flex items-center justify-center">
            <div className="bg-slate-900 text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl">
              <Loader2 className="animate-spin text-orange-500" size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Global Language Sync...</span>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[85%] relative ${msg.role === 'user' ? 'bg-slate-900 text-white shadow-xl' : 'bg-white text-slate-800 border border-slate-200 shadow-md'} rounded-2xl px-5 py-4`}>
              {msg.isGroundingActive && (
                <div className="text-[8px] font-black text-indigo-600 uppercase mb-2 flex items-center gap-1">
                  <MapPin size={10} /> Live Data Synced
                </div>
              )}
              
              <p className="text-[13px] leading-relaxed font-medium">{msg.text}</p>
              
              {msg.groundingLinks && msg.groundingLinks.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  {msg.groundingLinks.map((link, i) => (
                    <a key={i} href={link.uri} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-all">
                      {link.title} <MapPin size={12} />
                    </a>
                  ))}
                </div>
              )}

              {msg.role === 'model' && (
                <button 
                  onClick={() => playSpeech(msg.text)}
                  className="absolute -right-10 top-0 p-2 text-slate-400 hover:text-orange-600 transition-all"
                >
                  <Volume2 size={16} className={isSynthesizing ? 'animate-pulse text-orange-500' : ''} />
                </button>
              )}
              
              <div className={`text-[8px] font-bold mt-2 opacity-30 uppercase tracking-widest ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {msg.role === 'user' ? 'Pilgrim' : 'DivyaSahayak'}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 text-slate-400 px-4 py-2 rounded-full text-[10px] font-black uppercase animate-pulse flex items-center gap-2">
              <Loader2 size={12} className="animate-spin" /> Reasoning in {activeLanguage}...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Persistent Multimodal Input */}
      <div className="p-6 bg-white border-t shrink-0 shadow-inner">
        <div className="flex gap-4 items-center">
          <button 
            onClick={toggleRecording}
            className={`p-5 rounded-2xl shadow-lg transition-all active:scale-90 ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
          >
            {isRecording ? <StopCircle size={24} /> : <Mic size={24} />}
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isRecording ? "Listening..." : PLACEHOLDERS[activeLanguage]}
              className="w-full bg-slate-100 border-none rounded-2xl px-6 py-5 text-[14px] font-medium outline-none focus:ring-4 focus:ring-orange-500/10 transition-all"
            />
          </div>

          <button 
            onClick={() => handleSend()}
            disabled={!inputText.trim() || isLoading}
            className="p-5 bg-slate-900 text-white rounded-2xl shadow-xl hover:bg-black disabled:opacity-30 transition-all active:scale-95"
          >
            <Send size={24} />
          </button>
        </div>
        
        <div className="mt-4 flex items-center justify-center gap-6">
           <div className={`flex items-center gap-2 transition-opacity ${isVoiceMode ? 'opacity-100' : 'opacity-30'}`}>
              <Volume2 size={12} />
              <span className="text-[9px] font-black uppercase tracking-widest">Auto Dispatch Speech</span>
           </div>
           <div className="flex items-center gap-2 opacity-100 text-orange-600 font-black">
              <Languages size={12} />
              <span className="text-[9px] uppercase tracking-widest">{activeLanguage} Locked</span>
           </div>
           <div className="flex items-center gap-2 opacity-40">
              <History size={12} />
              <span className="text-[9px] font-black uppercase tracking-widest">Temporal Memory</span>
           </div>
        </div>
      </div>
    </div>
  );
};
