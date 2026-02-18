import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ChatSession } from '../types';

interface ChatProps {
  sessions: ChatSession[];
  setSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>;
}

const Chat: React.FC<ChatProps> = ({ sessions, setSessions }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // State for UI
  const [currentSessionId, setCurrentSessionId] = useState<string>(sessions[0]?.id || 'new');
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Get Current Session Data
  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession ? currentSession.messages : [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, currentSessionId]);

  const createNewSession = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: 'Nova Conversa',
      lastModified: Date.now(),
      messages: [{ id: 'init', sender: 'ai', text: 'Olá! Como posso te ajudar agora?' }]
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
    setShowHistory(false);
  };

  const simulateResponse = (userInput: string, sessionId: string) => {
    setIsTyping(true);
    let responseText = "Entendi. Vou analisar isso para você.";
    
    const lowerInput = userInput.toLowerCase();
    if (lowerInput.includes('motiva')) responseText = "O 'não' de hoje é o degrau para o 'sim' de amanhã. Vamos para cima?";
    else if (lowerInput.includes('script')) responseText = "Sugestão: 'Olá [Nome], vi que busca um imóvel X. Tenho uma oportunidade off-market. Podemos falar?'";
    
    setTimeout(() => {
      setSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          // Auto-update title if it's the first user message
          const newTitle = s.messages.length <= 1 ? userInput.slice(0, 20) + '...' : s.title;
          
          return {
            ...s,
            title: newTitle,
            lastModified: Date.now(),
            messages: [...s.messages, { id: Date.now().toString(), sender: 'ai', text: responseText }]
          };
        }
        return s;
      }));
      setIsTyping(false);
    }, 1500);
  };

  const handleSend = (text: string = input) => {
    if (!text.trim()) return;

    // If no session exists or we are in a 'temp' state (though we create init sessions now), ensure safety
    let targetSessionId = currentSessionId;
    if (!currentSession) {
      createNewSession();
      // Logic continues in next render effectively, but for simplicity let's rely on createNewSession for manual triggers
      return; 
    }

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: text
    };

    setSessions(prev => prev.map(s => s.id === targetSessionId ? {
      ...s,
      messages: [...s.messages, newMessage]
    } : s));

    setInput('');
    simulateResponse(text, targetSessionId);
  };

  return (
    <div className="flex h-full bg-slate-100 relative overflow-hidden">
      
      {/* Sidebar / History Drawer */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ${showHistory ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 md:w-72 flex flex-col`}>
         <div className="p-4 border-b border-slate-100 flex justify-between items-center pt-6">
            <h2 className="font-bold text-slate-800">Histórico</h2>
            <button onClick={() => setShowHistory(false)} className="md:hidden p-2 text-slate-400"><span className="material-symbols-outlined">close</span></button>
         </div>
         <div className="p-3">
            <button onClick={createNewSession} className="w-full py-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
               <span className="material-symbols-outlined">add</span> Nova Conversa
            </button>
         </div>
         <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessions.map(s => (
               <button 
                 key={s.id} 
                 onClick={() => { setCurrentSessionId(s.id); setShowHistory(false); }}
                 className={`w-full text-left p-3 rounded-lg text-sm font-medium transition-colors truncate ${
                   currentSessionId === s.id ? 'bg-slate-100 text-accent border border-slate-200' : 'text-slate-600 hover:bg-slate-50'
                 }`}
               >
                 {s.title}
               </button>
            ))}
         </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Header Copilot */}
        <div className="bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0 sticky top-0 z-10">
           <div className="flex items-center gap-3">
              <button onClick={() => setShowHistory(true)} className="md:hidden p-2 -ml-2 text-slate-500">
                 <span className="material-symbols-outlined">menu</span>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                   <span className="material-symbols-outlined text-white text-xl">smart_toy</span>
                </div>
                <div>
                   <h1 className="font-bold text-slate-900 leading-tight">ImobPilot <span className="text-accent">AI</span></h1>
                   <div className="flex items-center gap-1.5">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                     <p className="text-xs text-slate-500 font-medium">Online</p>
                   </div>
                </div>
              </div>
           </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4 pb-40 md:pb-24">
           {messages.map((msg) => (
               <div key={msg.id} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl text-sm md:text-base leading-relaxed shadow-sm ${
                       msg.sender === 'user' 
                         ? 'bg-primary text-white rounded-br-none' 
                         : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                   }`}>
                       <p className="whitespace-pre-wrap">{msg.text}</p>
                   </div>
               </div>
           ))}
           
           {isTyping && (
             <div className="flex justify-start w-full animate-pulse">
                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none border border-slate-200 flex items-center gap-1">
                   <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                   <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                   <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                </div>
             </div>
           )}
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 pt-3 pb-safe-bottom z-20 pb-20 md:pb-6">
           <div className="flex items-end gap-2 max-w-4xl mx-auto mb-2">
               <div className="flex-1 bg-slate-50 border border-slate-200 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent rounded-2xl px-4 py-3 transition-all">
                   <textarea 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Digite sua dúvida ou comando..."
                      rows={1}
                      className="w-full border-none bg-transparent resize-none focus:ring-0 text-sm p-0 placeholder-slate-400 text-slate-800 max-h-24"
                      onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                   />
               </div>
               <button 
                 onClick={() => handleSend()}
                 disabled={!input.trim()}
                 className="h-12 w-12 rounded-full bg-accent text-white flex items-center justify-center shadow-lg shadow-accent/30 disabled:opacity-50 disabled:shadow-none hover:bg-indigo-700 transition-all active:scale-95"
               >
                   <span className="material-symbols-outlined filled">send</span>
               </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;