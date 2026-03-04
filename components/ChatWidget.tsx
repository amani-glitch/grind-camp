import React, { useState, useRef, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { geminiLiveService, UserPersona } from '../services/geminiLiveService';
import { useChat } from '../contexts/ChatContext';

export const ChatWidget: React.FC = () => {
  const { isOpen, toggleChat, closeChat } = useChat();
  const [mode, setMode] = useState<'persona-select' | 'chat' | 'voice'>('persona-select');
  const [persona, setPersona] = useState<UserPersona | null>(null);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'connection' | 'active' | 'error' | 'disconnected'>('idle');
  const [inputVolume, setInputVolume] = useState(0); // 0 to 100
  
  // Text Chat State
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, mode]);

  // Clean up voice on close
  useEffect(() => {
    if (!isOpen) {
      geminiLiveService.disconnect();
      setVoiceStatus('idle');
      if (mode !== 'persona-select') setMode('persona-select');
    }
  }, [isOpen]);

  const handlePersonaSelect = async (p: UserPersona, initialMode: 'chat' | 'voice') => {
    setPersona(p);
    
    if (initialMode === 'chat') {
      setMode('chat');
      const welcomeMsg = p === 'parent' 
        ? "Bonjour. Je suis Botler, l'assistant du Grind Camp. Je peux répondre à vos questions sur les tarifs, la logistique ou l'encadrement. Comment puis-je vous aider ?"
        : "Salut ! Prêt à bosser ton game ? Je suis Botler. Je suis là pour te parler du camp, des drills et de l'intensité. C'est quoi ta question ?";
      setMessages([{ role: 'bot', text: welcomeMsg }]);
    } else {
      setMode('voice');
      await connectVoice(p);
    }
  };

  const connectVoice = async (p: UserPersona) => {
    await geminiLiveService.connect(
      p, 
      (status: any) => setVoiceStatus(status),
      (vol: number) => setInputVolume(vol) // Update volume state
    );
  };

  const toggleVoiceMode = async () => {
    if (mode === 'chat') {
      setMode('voice');
      if (persona) {
        await connectVoice(persona);
      }
    } else {
      geminiLiveService.disconnect();
      setMode('chat');
      setVoiceStatus('idle');
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue;
    setInputValue("");
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      const response = await geminiService.chat(userText);
      setMessages(prev => [...prev, { role: 'bot', text: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: "Désolé, une erreur est survenue." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const BasketballIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10"></path>
      <path d="M12 2a15.3 15.3 0 0 0-4 10 15.3 15.3 0 0 0 4 10"></path>
    </svg>
  );

  // Visualizer Component
  const AudioVisualizer = ({ volume }: { volume: number }) => {
    // 3 bars that react to volume
    return (
      <div className="flex items-end justify-center gap-1 h-8 mt-4">
        <div 
          className="w-2 bg-grind-orange rounded-full transition-all duration-75"
          style={{ height: `${Math.max(20, volume * 0.8)}%` }}
        ></div>
        <div 
          className="w-2 bg-grind-orange rounded-full transition-all duration-75"
          style={{ height: `${Math.max(30, volume)}%` }}
        ></div>
        <div 
          className="w-2 bg-grind-orange rounded-full transition-all duration-75"
          style={{ height: `${Math.max(20, volume * 0.6)}%` }}
        ></div>
      </div>
    );
  };

  if (!isOpen) {
    return (
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 bg-grind-orange text-white p-4 md:p-3 rounded-full shadow-[0_0_20px_rgba(255,106,0,0.5)] hover:bg-grind-fire transition-all hover:scale-110 group border-2 border-white/20 animate-pulse hover:animate-none"
        title="Ouvrir l'assistant"
      >
        <BasketballIcon className="h-8 w-8 md:h-6 md:w-6" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border border-white"></span>
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end font-body">
      <div className="mb-4 w-80 md:w-96 bg-grind-dark border border-grind-orange/30 rounded-lg shadow-2xl flex flex-col overflow-hidden animate-fade-in-up h-[500px]">
        
        {/* Header */}
        <div className="bg-grind-gray p-3 border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${voiceStatus === 'active' ? 'bg-red-500 animate-pulse' : 'bg-grind-orange'}`}></div>
            <span className="font-display uppercase tracking-wide text-white text-sm">Botler Assistant</span>
          </div>
          <div className="flex items-center gap-2">
            {mode !== 'persona-select' && (
              <button 
                onClick={toggleVoiceMode}
                className={`p-1.5 rounded-full transition-colors ${mode === 'voice' ? 'bg-red-500/20 text-red-500' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                title={mode === 'voice' ? "Arrêter le vocal" : "Passer en vocal"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            <button onClick={closeChat} className="text-gray-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* SCREEN: PERSONA SELECT */}
        {mode === 'persona-select' && (
          <div className="flex-1 flex flex-col justify-center items-center p-6 text-center space-y-6 bg-gradient-to-b from-grind-dark to-black">
            <h3 className="font-display text-2xl text-white uppercase">Qui es-tu ?</h3>
            <p className="text-gray-400 text-sm">Choisis ton profil et ton mode d'échange.</p>
            
            {/* Player Card */}
            <div className="w-full bg-grind-dark border border-white/10 p-4 rounded hover:border-grind-orange/50 transition-all">
              <div className="flex items-center justify-center gap-2 mb-2">
                 <span className="text-2xl">🏀</span>
                 <span className="font-display text-white uppercase text-xl">Joueur / Joueuse</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button onClick={() => handlePersonaSelect('player', 'chat')} className="bg-white/5 hover:bg-white/10 text-white text-xs py-2 rounded flex items-center justify-center gap-2 border border-white/5">💬 Écrire</button>
                <button onClick={() => handlePersonaSelect('player', 'voice')} className="bg-grind-orange hover:bg-grind-fire text-white text-xs py-2 rounded flex items-center justify-center gap-2">🎙️ Parler</button>
              </div>
            </div>

            {/* Parent Card */}
            <div className="w-full bg-grind-dark border border-white/10 p-4 rounded hover:border-grind-orange/50 transition-all">
              <div className="flex items-center justify-center gap-2 mb-2">
                 <span className="text-2xl">👨‍👩‍👦</span>
                 <span className="font-display text-white uppercase text-xl">Parent</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button onClick={() => handlePersonaSelect('parent', 'chat')} className="bg-white/5 hover:bg-white/10 text-white text-xs py-2 rounded flex items-center justify-center gap-2 border border-white/5">💬 Écrire</button>
                <button onClick={() => handlePersonaSelect('parent', 'voice')} className="bg-grind-orange hover:bg-grind-fire text-white text-xs py-2 rounded flex items-center justify-center gap-2">🎙️ Parler</button>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN: VOICE ACTIVE */}
        {mode === 'voice' && (
          <div className="flex-1 flex flex-col justify-center items-center p-6 bg-black relative overflow-hidden">
            <div className={`absolute inset-0 bg-grind-orange/5 ${voiceStatus === 'active' ? 'animate-pulse' : ''}`}></div>
            
            <div className="relative z-10 text-center w-full">
              {/* Status Indicator Circle */}
              <div className="flex justify-center mb-6">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 border-4 ${
                  voiceStatus === 'active' ? 'border-grind-orange shadow-[0_0_30px_rgba(255,106,0,0.4)] scale-110 bg-gray-900' : 'border-gray-700 bg-gray-800'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 ${voiceStatus === 'active' ? 'text-grind-orange' : 'text-gray-500'}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              <h3 className="font-display text-2xl text-white uppercase mb-2">Mode Vocal</h3>
              <p className="text-grind-orange font-mono text-sm uppercase tracking-widest mb-4">
                {voiceStatus === 'connection' && "Connexion..."}
                {voiceStatus === 'active' && "En écoute"}
                {voiceStatus === 'error' && "Micro indisponible"}
              </p>

              {/* MIC CHECK VISUALIZER */}
              {voiceStatus === 'active' && (
                <div className="mb-6">
                  <p className="text-xs text-gray-500 mb-1">Activité Micro</p>
                  <AudioVisualizer volume={inputVolume} />
                </div>
              )}

              <p className="text-gray-500 text-xs px-8 leading-relaxed">
                {persona === 'player' ? "Parle normalement. Coupe-moi la parole si besoin." : "Conversation naturelle. Posez vos questions librement."}
              </p>
            </div>
          </div>
        )}

        {/* SCREEN: TEXT CHAT */}
        {mode === 'chat' && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-black/50">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-lg p-3 text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-grind-orange text-white rounded-br-none' 
                      : 'bg-grind-gray text-gray-200 rounded-bl-none border border-white/10'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-grind-gray rounded-lg p-3 rounded-bl-none border border-white/10 flex gap-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleTextSubmit} className="p-3 bg-grind-gray border-t border-white/10">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Écris ton message..."
                  className="flex-1 bg-black/30 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-grind-orange"
                />
                <button type="submit" disabled={isLoading} className="bg-grind-orange p-2 rounded text-white hover:bg-grind-fire disabled:opacity-50">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      <button onClick={closeChat} className="bg-grind-orange text-white p-4 rounded-full shadow-[0_0_20px_rgba(255,106,0,0.5)] hover:bg-grind-fire transition-all hover:scale-110 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};