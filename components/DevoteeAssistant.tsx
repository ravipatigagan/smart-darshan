
import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, Volume2, MapPin, Database, MessageSquare, Sparkles, Languages, Loader2, VolumeX, History } from 'lucide-react';
import { ChatMessage, Language } from '../types';
import { getChatResponse, GroundingLink, synthesizeTts, translateWithGemini } from '../services/geminiService';

interface ExtendedChatMessage extends ChatMessage {
  groundingLinks?: GroundingLink[];
  isGroundingActive?: boolean;
}

export const DevoteeAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Namaskaram. I am DivyaSahayak, your unified temple assistant. How can I help you with timings, gates, or facilities today?",
      timestamp: new Date(),
      language: Language.ENGLISH
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLang, setSelectedLang] = useState<Language>(Language.ENGLISH);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isTranslatingHistory, setIsTranslatingHistory] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle instant conversation translation when language changes
  const handleLanguageChange = async (newLang: Language) => {
    if (newLang === selectedLang) return;
    
    setIsTranslatingHistory(true);
    setSelectedLang(newLang);

    // Translate all previous messages to the new language
    const translatedMessages = await Promise.all(messages.map(async (msg) => {
      const translatedText = await translateWithGemini(msg.text, newLang);
      return { ...msg, text: translatedText, language: newLang };
    }));

    setMessages(translatedMessages);
    setIsTranslatingHistory(false);
  };

  const playSpeech = async (text: string) => {
    setIsSynthesizing(true);
    const buffer = await synthesizeTts(text, selectedLang === Language.TELUGU ? 'Kore' : 'Zephyr');
    if (buffer) {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const source = audioCtxRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtxRef.current.destination);
      source.start();
      source.onended = () => setIsSynthesizing(false);
    } else {
      setIsSynthesizing(false);
    }
  };

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || inputText;
    if (!textToSend.trim()) return;

    const userMsg: ExtendedChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date(),
      language: selectedLang
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    const result = await getChatResponse(userMsg.text, selectedLang, false);
    
    const aiMsg: ExtendedChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: result.text,
      timestamp: new Date(),
      language: selectedLang,
      groundingLinks: result.groundingLinks,
      isGroundingActive: result.isGroundingActive
    };
    
    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);

    // Auto-play speech in voice mode or if configured
    if (isVoiceMode) {
      playSpeech(aiMsg.text);
    }
  };

  const handleMicClick = () => {
    // Simulated STT for PoC
    const prompts = {
      [Language.ENGLISH]: "Where is the North Gate?",
      [Language.TELUGU]: "ఉత్తర ద్వారం ఎక్కడ ఉంది?",
      [Language.HINDI]: "उत्तर द्वार कहाँ है?"
    };
    handleSend(prompts[selectedLang]);
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
            <p className="text-[8px] opacity-60 font-bold tracking-tighter flex items-center gap-1">
              <Database size={10} /> Unified Devotee Assistant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsVoiceMode(!isVoiceMode)}
            className={`p-2.5 rounded-xl border transition-all ${isVoiceMode ? 'bg-orange-600 border-orange-500' : 'bg-white/10 border-white/10 hover:bg-white/20'}`}
            title="Toggle Voice Mode"
          >
            {isVoiceMode ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          
          <div className="relative group">
            <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-xl border border-white/10 transition-all">
              <Languages size={14} className="text-orange-400" />
              <span className="text-[10px] font-black uppercase">{selectedLang.slice(0, 3)}</span>
            </button>
            <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-xl shadow-2xl border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none group-hover:pointer-events-auto overflow-hidden">
              {(Object.values(Language) as Language[]).map(lang => (
                <button 
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  className={`w-full text-left px-4 py-2.5 text-[10px] font-black uppercase transition-colors hover:bg-slate-50 ${selectedLang === lang ? 'text-orange-600 bg-orange-50' : 'text-slate-600'}`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide relative">
        {isTranslatingHistory && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-40 flex items-center justify-center">
            <div className="bg-slate-900 text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl">
              <Loader2 className="animate-spin text-orange-500" size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Translating Conversation...</span>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[85%] relative ${msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-white text-slate-800 border border-slate-200'} rounded-2xl px-5 py-4 shadow-md`}>
              {msg.isGroundingActive && (
                <div className="text-[8px] font-black text-indigo-600 uppercase mb-2 flex items-center gap-1">
                  <MapPin size={10} /> AI Grounding Verified
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
                  disabled={isSynthesizing}
                >
                  <Volume2 size={16} className={isSynthesizing ? 'animate-pulse text-orange-500' : ''} />
                </button>
              )}
              
              <div className={`text-[8px] font-bold mt-2 opacity-40 uppercase tracking-widest ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {msg.role === 'user' ? 'Pilgrim' : 'DivyaSahayak'}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 text-slate-400 px-4 py-2 rounded-full text-[10px] font-black uppercase animate-pulse flex items-center gap-2">
              <Loader2 size={12} className="animate-spin" /> DivyaSahayak is thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t shrink-0">
        <div className="flex gap-4 items-center">
          <button 
            onClick={handleMicClick}
            className={`p-5 rounded-2xl shadow-lg transition-all active:scale-90 ${isVoiceMode ? 'bg-orange-600 text-white shadow-orange-600/20' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
          >
            <Mic size={24} />
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isVoiceMode ? "Voice mode active..." : "Ask about gates, darshan, or facilities..."}
              className="w-full bg-slate-100 border-none rounded-2xl px-6 py-5 text-[14px] font-medium outline-none focus:ring-4 focus:ring-orange-500/5 transition-all"
            />
          </div>

          <button 
            onClick={() => handleSend()}
            disabled={!inputText.trim() || isLoading}
            className="p-5 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-900/10 hover:bg-black disabled:opacity-30 transition-all active:scale-95"
          >
            <Send size={24} />
          </button>
        </div>
        
        <div className="mt-4 flex items-center justify-center gap-6">
           <div className="flex items-center gap-2 opacity-40 grayscale">
              <History size={12} />
              <span className="text-[9px] font-black uppercase tracking-widest">History Synced</span>
           </div>
           <div className="flex items-center gap-2 opacity-40 grayscale">
              <MessageSquare size={12} />
              <span className="text-[9px] font-black uppercase tracking-widest">Secure Thread</span>
           </div>
        </div>
      </div>
    </div>
  );
};
