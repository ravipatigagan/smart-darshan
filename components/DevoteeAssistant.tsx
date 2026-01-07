import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Mic, Volume2, Globe, Phone, Smartphone, MessageCircle, Wifi, Radio, WifiOff, MessageSquareMore } from 'lucide-react';
import { ChatMessage, Language } from '../types';
import { getChatResponse } from '../services/geminiService';
import { queueData } from '../services/offlineStore';

type Channel = 'WEB' | 'WHATSAPP' | 'IVR';

interface DevoteeAssistantProps {
    isOffline?: boolean;
}

export const DevoteeAssistant: React.FC<DevoteeAssistantProps> = ({ isOffline = false }) => {
  const [activeChannel, setActiveChannel] = useState<Channel>('WEB');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Namaskaram! I am DivyaSahayak. How may I assist you with your darshan today?",
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLang, setSelectedLang] = useState<Language>(Language.ENGLISH);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOffline && activeChannel === 'WEB') {
        // Optional logic for auto-switch notification
    }
  }, [isOffline]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChannel, isOffline]);

  // --- TEXT TO SPEECH LOGIC ---
  const speakText = (text: string, lang: Language) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#]/g, '').replace(/https?:\/\/\S+/g, 'link');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    let voice = null;
    if (lang === Language.TELUGU) voice = voices.find(v => v.lang.includes('te'));
    else if (lang === Language.HINDI) voice = voices.find(v => v.lang.includes('hi'));
    if (!voice) voice = voices.find(v => v.lang.includes('en-IN')) || voices[0];
    if (voice) utterance.voice = voice;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    // --- OFFLINE QUEUEING ---
    if (isOffline) {
        queueData('CHAT_MSG', userMsg);
        const offlineReply: ChatMessage = {
             id: (Date.now() + 1).toString(),
             role: 'model',
             text: "I am currently offline due to low connectivity. Your message has been queued.\n\nFor immediate assistance, please use the SMS or Voice options below.",
             timestamp: new Date(),
             language: selectedLang
        };
        setTimeout(() => {
            setMessages(prev => [...prev, offlineReply]);
        }, 500);
        return;
    }

    // --- ONLINE HYBRID AI CALL ---
    setIsLoading(true);
    // Pass isOffline to service to decide between Gemini API and Local Brain
    const responseText = await getChatResponse(userMsg.text, selectedLang, isOffline);
    
    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: new Date(),
      language: selectedLang
    };
    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);

    if (activeChannel === 'IVR') {
        speakText(responseText, selectedLang);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const openSMS = () => {
      const body = encodeURIComponent("Jai Mata Di. I need help regarding Darshan timings.");
      window.open(`sms:1800555108?body=${body}`, '_blank');
  };

  const openCall = () => {
      window.open('tel:1800555108', '_self');
  };

  // --- CHANNEL UI SWITCHER ---
  const ChannelTab = ({ channel, icon: Icon, label }: { channel: Channel, icon: any, label: string }) => (
    <button
      onClick={() => {
        setActiveChannel(channel);
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }}
      className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium transition-colors ${
        activeChannel === channel
          ? 'bg-white text-slate-900 shadow-sm'
          : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      <Icon size={14} className={activeChannel === channel ? (channel === 'WHATSAPP' ? 'text-green-500' : channel === 'IVR' ? 'text-purple-500' : 'text-orange-500') : ''} />
      {label}
    </button>
  );

  // --- RENDER METHODS ---

  const renderWhatsAppMode = () => (
    <div className="flex flex-col h-full bg-[#e5ddd5]">
        <div className="bg-[#075e54] text-white p-3 flex items-center gap-3 shadow-md">
            <div className="w-8 h-8 rounded-full bg-white p-1">
                <MessageSquare className="w-full h-full text-[#075e54]" />
            </div>
            <div className="flex-1">
                <h3 className="font-semibold text-sm">DivyaSahayak (Verified)</h3>
                <p className="text-[10px] opacity-80">{isOffline ? 'Waiting for network...' : 'Official Temple Account'}</p>
            </div>
            <div className="flex gap-3">
                <Phone size={18} />
                {isOffline ? <WifiOff size={18} className="opacity-50"/> : <Wifi size={18} />}
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px'}}>
            <div className="bg-[#dcf8c6] text-[10px] text-center p-1 rounded mb-4 text-slate-600 shadow-sm mx-auto w-fit">
                Messages are end-to-end encrypted.
            </div>
            {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-2 rounded-lg shadow-sm text-sm relative ${
                        msg.role === 'user' ? 'bg-[#dcf8c6] text-black rounded-tr-none' : 'bg-white text-black rounded-tl-none'
                    }`}>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        <span className="text-[9px] text-slate-500 flex justify-end mt-1 gap-1">
                            {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            {msg.role === 'user' && <span className={isOffline ? 'text-slate-400' : 'text-blue-500'}>{isOffline ? '🕒' : '✓✓'}</span>}
                        </span>
                    </div>
                </div>
            ))}
            <div ref={bottomRef} />
        </div>

        <div className="p-2 bg-[#f0f0f0] flex items-center gap-2">
             <input 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Message"
                className="flex-1 bg-white rounded-full px-4 py-2 text-sm focus:outline-none"
             />
             <button onClick={handleSend} className="p-2 bg-[#075e54] text-white rounded-full">
                <Send size={16} />
             </button>
        </div>
    </div>
  );

  const renderIVRMode = () => (
    <div className="flex flex-col h-full bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
            <Radio size={200} className="animate-pulse" />
        </div>

        <div className="p-4 text-center border-b border-slate-800 z-10">
            <h2 className="text-lg font-mono text-green-400">IVR VOICE GATEWAY</h2>
            <p className="text-xs text-slate-400">Toll Free: 1800-TEMPLE-HELP</p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 z-10">
            <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center transition-all duration-500 ${
                isSpeaking ? 'border-green-500 shadow-[0_0_40px_rgba(34,197,94,0.3)] scale-110' : 'border-slate-600'
            }`}>
                {isSpeaking ? (
                     <Volume2 size={48} className="text-green-400 animate-bounce" />
                ) : (
                     <Mic size={48} className="text-slate-400" />
                )}
            </div>
            
            <div className="mt-8 w-full max-w-md text-center space-y-4">
                {isOffline ? (
                    <div className="bg-red-900/30 p-4 rounded-xl border border-red-700/50">
                        <p className="text-sm font-mono text-red-200 mb-3">INTERNET CONNECTION LOST</p>
                        <button onClick={openCall} className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold flex items-center justify-center gap-2">
                             <Phone size={18} /> CALL 1800-TEMPLE (GSM)
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 min-h-[100px] flex items-center justify-center">
                             {messages.length > 0 ? (
                                 <p className="text-sm font-mono text-green-200">
                                     "{messages[messages.length - 1].text}"
                                 </p>
                             ) : (
                                 <p className="text-sm text-slate-500">System Ready...</p>
                             )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => speakText(messages[messages.length-1]?.text || "", selectedLang)} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold border border-slate-600">
                                REPLAY MESSAGE
                            </button>
                            <button className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold border border-slate-600">
                                CONNECT AGENT
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>

        <div className="p-4 bg-slate-800 border-t border-slate-700 z-10">
            <div className="flex gap-2">
                <input 
                    value={inputText} 
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Simulate Voice Input..."
                    disabled={isOffline}
                    className="flex-1 bg-slate-900 text-white px-4 py-3 rounded-lg border border-slate-700 focus:border-green-500 outline-none disabled:opacity-50"
                />
                <button onClick={handleSend} disabled={isOffline} className="p-3 bg-green-600 rounded-lg text-white font-bold disabled:opacity-50 disabled:bg-slate-600">
                    SPEAK
                </button>
            </div>
        </div>
    </div>
  );

  const renderWebMode = () => (
    <>
      <div className="p-4 bg-orange-600 text-white flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-full">
            <MessageSquare size={20} />
          </div>
          <div>
            <h2 className="font-semibold">DivyaSahayak</h2>
            <p className="text-xs text-orange-100">{isOffline ? 'Offline Mode' : 'Virtual Assistant'}</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
            <Globe size={16} className="text-orange-100"/>
            <select 
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value as Language)}
                className="bg-orange-700 text-white text-sm rounded px-2 py-1 border-none outline-none cursor-pointer"
            >
                <option value={Language.ENGLISH}>English</option>
                <option value={Language.TELUGU}>Telugu</option>
                <option value={Language.HINDI}>Hindi</option>
            </select>
        </div>
      </div>

      {isOffline && (
          <div className="bg-slate-800 text-white p-3 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                  <WifiOff size={14} />
                  <span>Remote Zone: Weak Signal</span>
              </div>
              <div className="flex gap-2">
                  <button onClick={openSMS} className="bg-white text-slate-900 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 hover:bg-slate-200">
                      <MessageSquareMore size={10}/> SMS
                  </button>
                  <button onClick={openCall} className="bg-green-500 text-white px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 hover:bg-green-600">
                      <Phone size={10}/> CALL
                  </button>
              </div>
          </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm relative group ${
                msg.role === 'user'
                  ? 'bg-orange-600 text-white rounded-br-none'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
              <span className={`text-[10px] mt-1 block ${msg.role === 'user' ? 'text-orange-200' : 'text-slate-400'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {msg.role === 'user' && isOffline && <span className="ml-1 text-orange-200 italic">(Queued)</span>}
              </span>
              
              {msg.role === 'model' && (
                  <button 
                    onClick={() => speakText(msg.text, msg.language || selectedLang)}
                    className="absolute -right-8 top-1 p-1.5 text-slate-400 hover:text-orange-600 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                    title="Read Aloud"
                  >
                      <Volume2 size={14} />
                  </button>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-500 hover:text-orange-600 transition-colors rounded-full hover:bg-orange-50">
            <Mic size={20} />
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={isOffline ? "Message will be queued..." : `Ask in ${selectedLang}...`}
              className="w-full border border-slate-300 rounded-full pl-4 pr-10 py-2 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
            className="p-2 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="flex border-b border-slate-200 bg-slate-50 flex-shrink-0">
        <ChannelTab channel="WEB" icon={Globe} label="Assistant" />
        <ChannelTab channel="WHATSAPP" icon={MessageCircle} label="WhatsApp" />
        <ChannelTab channel="IVR" icon={Smartphone} label="IVR/Call" />
      </div>

      <div className="flex-1 overflow-hidden relative">
         {activeChannel === 'WEB' && renderWebMode()}
         {activeChannel === 'WHATSAPP' && renderWhatsAppMode()}
         {activeChannel === 'IVR' && renderIVRMode()}
      </div>
    </div>
  );
};