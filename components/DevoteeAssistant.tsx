
import React, { useState, useEffect, useRef } from 'react';
import { Globe, Send, Mic, Volume2, Sparkles, MapPin, Database, MessageCircle, Smartphone, Radio } from 'lucide-react';
import { ChatMessage, Language } from '../types';
import { getChatResponse, GroundingLink } from '../services/geminiService';

type Channel = 'WEB' | 'WHATSAPP' | 'IVR';

interface ExtendedChatMessage extends ChatMessage {
  groundingLinks?: GroundingLink[];
  isGroundingActive?: boolean;
}

export const DevoteeAssistant: React.FC = () => {
  const [activeChannel, setActiveChannel] = useState<Channel>('WEB');
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Namaskaram. I am DivyaSahayak. I can assist with gate rules, temple timings, and facilities at Dwarakatirumala. How can I help?",
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLang, setSelectedLang] = useState<Language>(Language.ENGLISH);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChannel]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMsg: ExtendedChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: new Date(),
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
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
      <div className="flex border-b">
        {[
            { id: 'WEB', icon: Globe, label: 'Portal' },
            { id: 'WHATSAPP', icon: MessageCircle, label: 'Official Bot' },
            { id: 'IVR', icon: Smartphone, label: 'Voice' }
        ].map(ch => (
            <button
                key={ch.id}
                onClick={() => setActiveChannel(ch.id as Channel)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeChannel === ch.id ? 'bg-slate-900 text-white' : 'text-slate-400 bg-slate-50 hover:bg-slate-100'
                }`}
            >
                <ch.icon size={14} />
                {ch.label}
            </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
                <Database size={16} className="text-orange-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Balanced Engine Loaded</span>
            </div>
            <select 
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value as Language)}
                className="bg-white/10 text-white text-[10px] font-bold px-2 py-1 rounded border border-white/20 outline-none"
            >
                <option value={Language.ENGLISH}>English</option>
                <option value={Language.TELUGU}>తెలుగు</option>
                <option value={Language.HINDI}>हिन्दी</option>
            </select>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50 scrollbar-hide">
            {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-white text-slate-800 border'} rounded-2xl px-5 py-4 shadow-sm`}>
                        {msg.isGroundingActive && (
                            <div className="text-[8px] font-black text-blue-600 uppercase mb-2 flex items-center gap-1">
                                <MapPin size={8} /> Spatial Grounding Active
                            </div>
                        )}
                        <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        {msg.groundingLinks && (
                            <div className="mt-3 space-y-1">
                                {msg.groundingLinks.map((link, i) => (
                                    <a key={i} href={link.uri} target="_blank" className="flex items-center justify-between p-2 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-lg border border-blue-100">
                                        {link.title} <MapPin size={10} />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ))}
            {isLoading && <div className="text-[9px] font-black text-slate-400 uppercase animate-pulse">Consulting Dataset...</div>}
            <div ref={bottomRef} />
        </div>

        <div className="p-4 bg-white border-t flex gap-2">
            <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask about temple gates or timings..."
                className="flex-1 bg-slate-100 border-none rounded-2xl px-5 py-4 text-[13px] focus:ring-2 focus:ring-orange-500/20 outline-none"
            />
            <button onClick={handleSend} className="p-4 bg-orange-600 text-white rounded-2xl shadow-lg hover:bg-orange-700 transition-all">
                <Send size={20} />
            </button>
        </div>
      </div>
    </div>
  );
};
