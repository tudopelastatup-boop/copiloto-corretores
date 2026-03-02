import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Lead, Task, FinancialEntry, ContractTemplate, UserProfile, AIAction, NavigationItem } from '../types';

interface AIPopupProps {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  financialEntries: FinancialEntry[];
  setFinancialEntries: React.Dispatch<React.SetStateAction<FinancialEntry[]>>;
  contracts: ContractTemplate[];
  user: UserProfile;
  activeTab: NavigationItem;
}

// ========== SPEECH-TO-TEXT TYPES ==========
interface SpeechRecognitionEvent {
  results: { [key: number]: { [key: number]: { transcript: string } } };
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

// ========== CONTEXT BUILDER ==========

const buildContextPrompt = (
  user: UserProfile,
  leads: Lead[],
  tasks: Task[],
  financialEntries: FinancialEntry[],
  contracts: ContractTemplate[],
  activeTab: NavigationItem
) => {
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.date === today);
  const currentMonth = today.slice(0, 7);
  const monthEntries = financialEntries.filter(e => e.date.startsWith(currentMonth));
  const receitas = monthEntries.filter(e => e.type === 'receita').reduce((s, e) => s + e.amount, 0);
  const despesas = monthEntries.filter(e => e.type === 'despesa').reduce((s, e) => s + e.amount, 0);

  let tabContext = '';
  switch (activeTab) {
    case 'rotina':
      tabContext = `CONTEXTO DA ABA ROTINA:\nTarefas de hoje: ${todayTasks.length} (${todayTasks.filter(t => !t.completed).length} pendentes)\n${todayTasks.map(t => `- [${t.completed ? 'x' : ' '}] ${t.title}`).join('\n')}`;
      break;
    case 'leads':
      tabContext = `CONTEXTO DA ABA CRM:\n${leads.map(l => `- ${l.name} | ${l.status} | Último contato: ${l.lastInteraction}`).join('\n')}`;
      break;
    case 'financeiro':
      tabContext = `CONTEXTO DA ABA FINANCEIRO:\nReceitas: R$ ${receitas.toLocaleString('pt-BR')}\nDespesas: R$ ${despesas.toLocaleString('pt-BR')}\nSaldo: R$ ${(receitas - despesas).toLocaleString('pt-BR')}`;
      break;
    case 'contratos':
      tabContext = `CONTEXTO DA ABA CONTRATOS:\nModelos: ${contracts.map(c => c.title).join(', ')}`;
      break;
    default:
      tabContext = `CONTEXTO GERAL:\nLeads: ${leads.length} | Tarefas hoje: ${todayTasks.length} | Saldo do mês: R$ ${(receitas - despesas).toLocaleString('pt-BR')}`;
  }

  return `Você é o ImobPilot AI, assistente rápido para corretores de imóveis.
Corretor: ${user.name} | CRECI: ${user.creci}

${tabContext}

Responda de forma curta e direta. Use português brasileiro.
Se sugerir criar algo, use o formato action:
\`\`\`action
{"type": "create_task", "data": {"title": "...", "date": "${today}", "type": "geral"}}
\`\`\``;
};

// Mock response for popup
const generatePopupMock = (input: string, activeTab: NavigationItem): string => {
  const lower = input.toLowerCase();

  if (lower.includes('analisar') || lower.includes('análise') || lower.includes('resumo')) {
    switch (activeTab) {
      case 'rotina':
        return 'Analisando sua rotina: você tem tarefas pendentes para hoje. Foque primeiro nas que envolvem leads quentes! Priorize ligações e follow-ups.';
      case 'leads':
        return 'Sua carteira está saudável! Recomendo focar nos leads mornos antes que esfriem. Um follow-up rápido pode fazer a diferença.';
      case 'financeiro':
        return 'Suas receitas estão superando as despesas este mês. Continue controlando gastos com transporte agrupando visitas por região.';
      default:
        return 'Tudo certo por aqui! Você está no caminho. Continue focado nas ligações e follow-ups para manter o pipeline ativo.';
    }
  }

  if (lower.includes('tarefa') || lower.includes('criar')) {
    return `Vou criar essa tarefa para você!

\`\`\`action
{"type": "create_task", "data": {"title": "${input.replace(/cri[ae]\s*(uma\s*)?tarefa\s*(para\s*)?/i, '').trim() || 'Nova tarefa'}", "date": "${new Date().toISOString().split('T')[0]}", "type": "geral"}}
\`\`\``;
  }

  if (lower.includes('sugest') || lower.includes('dica') || lower.includes('o que')) {
    return `Sugestões rápidas para agora:\n- Faça follow-up com leads mornos\n- Poste no Instagram\n- Organize documentação pendente\n\n\`\`\`action
{"type": "suggest_tasks", "data": {"tasks": [{"title": "Follow-up com leads mornos", "type": "follow_up"}, {"title": "Postar no Instagram", "type": "marketing"}]}}
\`\`\``;
  }

  return 'Entendi! Posso te ajudar com análises, criar tarefas, ou dar sugestões. O que precisa?';
};

const parseAction = (text: string): { cleanText: string; action?: AIAction } => {
  const match = text.match(/```action\s*\n?([\s\S]*?)\n?```/);
  if (!match) return { cleanText: text.trim() };
  const cleanText = text.replace(/```action\s*\n?[\s\S]*?\n?```/, '').trim();
  try {
    return { cleanText, action: JSON.parse(match[1].trim()) as AIAction };
  } catch {
    return { cleanText: text.trim() };
  }
};

// ========== COMPONENT ==========

const AIPopup: React.FC<AIPopupProps> = ({
  leads, setLeads, tasks, setTasks,
  financialEntries, setFinancialEntries,
  contracts, user, activeTab,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'init', sender: 'ai', text: 'Oi! Sou seu copiloto rápido. Pergunte qualquer coisa!' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: ChatMessage = { id: `pu-${Date.now()}`, sender: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Try API, fallback to mock
    const apiKey = (import.meta as unknown as Record<string, Record<string, string>>).env?.VITE_GEMINI_API_KEY;
    let responseText: string;

    if (apiKey) {
      try {
        const systemPrompt = buildContextPrompt(user, leads, tasks, financialEntries, contracts, activeTab);
        const contents = [
          { role: 'user', parts: [{ text: `[SYSTEM]\n${systemPrompt}\n[/SYSTEM]` }] },
          { role: 'model', parts: [{ text: 'Pronto para ajudar!' }] },
          ...messages.filter(m => m.id !== 'init').map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
          })),
          { role: 'user', parts: [{ text: input.trim() }] }
        ];

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents, generationConfig: { temperature: 0.7, maxOutputTokens: 512 } })
          }
        );
        const data = await response.json();
        responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Desculpe, não consegui processar.';
      } catch {
        responseText = generatePopupMock(input.trim(), activeTab);
      }
    } else {
      responseText = generatePopupMock(input.trim(), activeTab);
    }

    const { cleanText, action } = parseAction(responseText);
    const aiMsg: ChatMessage = { id: `pai-${Date.now()}`, sender: 'ai', text: cleanText, action, actionExecuted: false };
    setMessages(prev => [...prev, aiMsg]);
    setIsTyping(false);
  };

  const executeAction = (action: AIAction, messageId: string) => {
    const today = new Date().toISOString().split('T')[0];

    switch (action.type) {
      case 'create_task': {
        const d = action.data as Record<string, string>;
        setTasks(prev => [...prev, {
          id: `t-${Date.now()}`, title: d.title || 'Nova tarefa', description: d.description,
          completed: false, date: d.date || today, type: (d.type as Task['type']) || 'geral',
          leadId: d.leadId, createdAt: Date.now(),
        }]);
        break;
      }
      case 'create_lead': {
        const d = action.data as Record<string, string | number>;
        setLeads(prev => [...prev, {
          id: `l-${Date.now()}`, name: (d.name as string) || 'Novo Lead', phone: (d.phone as string) || '',
          status: (d.status as string) || 'Morno', value: (d.value as number) || 0,
          email: d.email as string, lastInteraction: today, properties: [], interactions: [],
        }]);
        break;
      }
      case 'create_financial': {
        const d = action.data as Record<string, string | number>;
        setFinancialEntries(prev => [...prev, {
          id: `fe-${Date.now()}`, type: (d.type as 'receita' | 'despesa') || 'despesa',
          description: (d.description as string) || '', amount: (d.amount as number) || 0,
          category: (d.category as FinancialEntry['category']) || 'outro',
          date: (d.date as string) || today, createdAt: Date.now(),
        }]);
        break;
      }
      case 'suggest_tasks': {
        const d = action.data as { tasks: { title: string; type: string }[] };
        if (d.tasks) {
          d.tasks.forEach((t, i) => {
            setTasks(prev => [...prev, {
              id: `t-${Date.now()}-${i}`, title: t.title, completed: false,
              date: today, type: (t.type as Task['type']) || 'geral', createdAt: Date.now(),
            }]);
          });
        }
        break;
      }
    }

    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, actionExecuted: true } : m));
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SR = (window as Window).SpeechRecognition || (window as Window).webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      setInput(prev => prev ? prev + ' ' + event.results[0][0].transcript : event.results[0][0].transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  // Don't show FAB on copilot tab (full chat already there)
  if (activeTab === 'copilot') return null;

  return (
    <>
      {/* FAB Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-40 w-14 h-14 rounded-full bg-accent text-white flex items-center justify-center shadow-xl shadow-accent/30 hover:shadow-2xl hover:scale-105 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-2xl filled">auto_awesome</span>
        </button>
      )}

      {/* Popup */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-40 w-[calc(100vw-2rem)] max-w-80 h-[28rem] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-[slideUp_0.2s_ease-out]">
          {/* Header */}
          <div className="bg-primary px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-lg">smart_toy</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-tight">ImobPilot AI</h3>
                <p className="text-[10px] text-slate-400">Copiloto rápido</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <span className="material-symbols-outlined text-white text-sm">close</span>
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[85%]">
                  <div className={`px-3 py-2 rounded-xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-primary text-white rounded-br-none'
                      : 'bg-slate-100 text-slate-700 rounded-bl-none'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>

                  {msg.action && !msg.actionExecuted && (
                    <div className="mt-1.5 bg-indigo-50 rounded-lg p-2 border border-indigo-200">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => executeAction(msg.action!, msg.id)}
                          className="px-2 py-1 bg-accent text-white rounded-md text-[10px] font-medium hover:bg-indigo-700 transition-colors"
                        >
                          {msg.action.type === 'suggest_tasks' ? 'Adicionar' : 'Criar'}
                        </button>
                        <button
                          onClick={() => setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, actionExecuted: true } : m))}
                          className="px-2 py-1 bg-white text-slate-500 rounded-md text-[10px] font-medium border border-slate-200"
                        >
                          Ignorar
                        </button>
                      </div>
                    </div>
                  )}

                  {msg.action && msg.actionExecuted && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600">
                      <span className="material-symbols-outlined text-xs filled">check_circle</span>
                      Executado
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-100 px-3 py-2 rounded-xl rounded-bl-none flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                  <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-slate-100 px-3 py-2 flex items-center gap-2 shrink-0">
            <button
              onClick={toggleListening}
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-sm">{isListening ? 'stop' : 'mic'}</span>
            </button>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
              placeholder={isListening ? 'Ouvindo...' : 'Pergunte algo...'}
              className="flex-1 bg-slate-50 rounded-lg px-3 py-2 text-xs border border-slate-200 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center shrink-0 disabled:opacity-50 hover:bg-indigo-700 transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined text-sm filled">send</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIPopup;
