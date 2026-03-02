import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ChatSession, Lead, Task, FinancialEntry, ContractTemplate, UserProfile, AIAction, NavigationItem } from '../types';

interface ChatProps {
  sessions: ChatSession[];
  setSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>;
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

// ========== GEMINI API ==========

const buildSystemPrompt = (user: UserProfile, leads: Lead[], tasks: Task[], financialEntries: FinancialEntry[], contracts: ContractTemplate[]) => {
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.date === today);
  const pendingTasks = todayTasks.filter(t => !t.completed);
  const completedTasks = todayTasks.filter(t => t.completed);

  const currentMonth = today.slice(0, 7);
  const monthEntries = financialEntries.filter(e => e.date.startsWith(currentMonth));
  const receitas = monthEntries.filter(e => e.type === 'receita').reduce((s, e) => s + e.amount, 0);
  const despesas = monthEntries.filter(e => e.type === 'despesa').reduce((s, e) => s + e.amount, 0);

  const leadsResume = leads.map(l => `- ${l.name} | Status: ${l.status} | Valor: R$${l.value.toLocaleString('pt-BR')} | Último contato: ${l.lastInteraction}${l.notes ? ` | Notas: ${l.notes}` : ''}`).join('\n');

  const tasksResume = todayTasks.map(t => `- [${t.completed ? 'x' : ' '}] ${t.title} (${t.type}${t.leadId ? ` | Lead: ${leads.find(l => l.id === t.leadId)?.name || t.leadId}` : ''})`).join('\n');

  return `Você é o ImobPilot AI, assistente inteligente para corretores de imóveis no Brasil.
Você tem acesso ao banco de dados do corretor e pode ajudar com:
- Análise de leads e sugestões de follow-up
- Organização de rotina e produtividade
- Análise financeira
- Criação de contratos
- Sugestões de marketing e vendas
- Motivação e coaching

DADOS DO CORRETOR:
Nome: ${user.name}
CRECI: ${user.creci}
Email: ${user.email}
Telefone: ${user.phone}

LEADS (${leads.length} leads):
${leadsResume || 'Nenhum lead cadastrado.'}

TAREFAS DE HOJE (${todayTasks.length} total | ${pendingTasks.length} pendentes | ${completedTasks.length} concluídas):
${tasksResume || 'Nenhuma tarefa para hoje.'}

FINANCEIRO DO MÊS:
Receitas: R$ ${receitas.toLocaleString('pt-BR')}
Despesas: R$ ${despesas.toLocaleString('pt-BR')}
Saldo: R$ ${(receitas - despesas).toLocaleString('pt-BR')}

MODELOS DE CONTRATO (${contracts.length}):
${contracts.map(c => `- ${c.title}`).join('\n') || 'Nenhum modelo.'}

Responda de forma direta, prática e motivacional. Use português brasileiro.
Se o corretor pedir para criar algo (tarefa, lead, lançamento financeiro), responda com a ação em formato JSON no final da mensagem, envolto em tags \`\`\`action\`\`\`:

\`\`\`action
{"type": "create_task", "data": {"title": "...", "date": "${today}", "type": "geral"}}
\`\`\`

Tipos de ação possíveis:
- create_task: criar tarefa (data: {title, date, type, leadId?, description?})
- create_lead: criar lead (data: {name, phone, status, value, email?})
- create_financial: criar lançamento financeiro (data: {type: "receita"|"despesa", description, amount, category, date})
- suggest_tasks: sugerir lista de tarefas (data: {tasks: [{title, type}]})

IMPORTANTE: Sempre forneça a resposta textual primeiro, depois a tag action se necessário.`;
};

const callGeminiAPI = async (
  messages: ChatMessage[],
  systemPrompt: string
): Promise<string> => {
  const apiKey = (import.meta as unknown as Record<string, Record<string, string>>).env?.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    // Fallback: smart mock responses when no API key
    return generateMockResponse(messages[messages.length - 1]?.text || '');
  }

  const contents = messages.map(m => ({
    role: m.sender === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }]
  }));

  // Prepend system prompt as first user message context
  contents.unshift({
    role: 'user',
    parts: [{ text: `[SYSTEM]\n${systemPrompt}\n[/SYSTEM]\n\nResponda como ImobPilot AI a partir de agora.` }]
  });
  contents.splice(1, 0, {
    role: 'model',
    parts: [{ text: 'Entendido! Sou o ImobPilot AI, pronto para ajudar. Como posso te ajudar?' }]
  });

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024
          }
        })
      }
    );

    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Desculpe, não consegui processar sua solicitação.';
  } catch {
    return 'Erro ao conectar com a IA. Verifique sua conexão e tente novamente.';
  }
};

// Smart mock responses for when there's no API key
const generateMockResponse = (userInput: string): string => {
  const lower = userInput.toLowerCase();

  if (lower.includes('tarefa') || lower.includes('criar tarefa') || lower.includes('crie uma tarefa')) {
    return `Claro! Vou criar essa tarefa para você. 💪

\`\`\`action
{"type": "create_task", "data": {"title": "${userInput.replace(/cri[ae]\s*(uma\s*)?tarefa\s*(para\s*)?/i, '').trim() || 'Nova tarefa'}", "date": "${new Date().toISOString().split('T')[0]}", "type": "geral"}}
\`\`\``;
  }

  if (lower.includes('lead') && (lower.includes('criar') || lower.includes('novo') || lower.includes('adicionar'))) {
    return `Vou adicionar esse novo lead ao seu CRM! 🎯

\`\`\`action
{"type": "create_lead", "data": {"name": "Novo Lead", "phone": "", "status": "Morno", "value": 0}}
\`\`\``;
  }

  if (lower.includes('suger') || lower.includes('sugestão') || lower.includes('o que fazer') || lower.includes('sugestões')) {
    return `Aqui estão minhas sugestões para turbinar seu dia! 🚀

1. **Follow-up com leads mornos** — Não deixe esfriar!
2. **Postar no Instagram** — Mantenha a presença digital
3. **Ligar para 3 leads quentes** — Fechar é a prioridade
4. **Organizar documentação** — Estar preparado agiliza tudo

\`\`\`action
{"type": "suggest_tasks", "data": {"tasks": [{"title": "Follow-up com leads mornos", "type": "follow_up"}, {"title": "Postar stories no Instagram", "type": "marketing"}, {"title": "Ligar para leads quentes", "type": "ligacao"}, {"title": "Organizar documentação pendente", "type": "administrativo"}]}}
\`\`\``;
  }

  if (lower.includes('motiv') || lower.includes('animo') || lower.includes('desanim')) {
    return `Ei, lembra por que você escolheu essa profissão! 🏠✨

Cada "não" te aproxima do próximo "sim". Os melhores corretores não são os que nunca ouvem não — são os que nunca param de tentar.

**Fato:** Corretores de sucesso fazem em média 12 contatos antes de fechar uma venda. Continue persistindo!

Vamos juntos! O que posso fazer para te ajudar agora?`;
  }

  if (lower.includes('financ') || lower.includes('comiss') || lower.includes('gasto') || lower.includes('receita')) {
    return `Vamos analisar suas finanças! 📊

Baseado nos seus dados do mês, recomendo:
- **Controlar gastos com combustível** — considere agrupar visitas por região
- **Investir mais em marketing digital** — o retorno tende a ser maior que o presencial
- **Reservar 20% das comissões** — criar uma reserva de emergência

Quer que eu crie um lançamento financeiro?`;
  }

  if (lower.includes('contrato') || lower.includes('documento')) {
    return `Sobre contratos, posso te ajudar com:

1. **Usar um modelo existente** — Acesse a aba Contratos para gerar para um lead
2. **Dicas de cláusulas** — Sempre inclua cláusula de rescisão e multa
3. **Revisão** — Verifique prazos e valores antes de enviar ao cliente

Precisa de algo específico sobre contratos?`;
  }

  if (lower.includes('olá') || lower.includes('oi') || lower.includes('bom dia') || lower.includes('boa tarde') || lower.includes('boa noite')) {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    return `${greeting}! 👋 Sou o ImobPilot AI, seu copiloto imobiliário.

Posso te ajudar com:
- 📋 Criar tarefas e organizar sua rotina
- 👥 Analisar leads e sugerir follow-ups
- 💰 Analisar suas finanças
- 📄 Dúvidas sobre contratos
- 💪 Motivação e coaching

O que precisa hoje?`;
  }

  return `Entendi sua solicitação! 🤔

Posso te ajudar com diversas coisas:
- **"Crie uma tarefa para..."** — Adiciono na sua rotina
- **"Sugestões para hoje"** — Dou dicas práticas
- **"Me motiva!"** — Energize o seu dia
- **"Análise financeira"** — Vejo seus números

O que prefere?`;
};

// ========== PARSE ACTIONS ==========

const parseActionFromResponse = (text: string): { cleanText: string; action?: AIAction } => {
  const actionMatch = text.match(/```action\s*\n?([\s\S]*?)\n?```/);
  if (!actionMatch) return { cleanText: text.trim() };

  const cleanText = text.replace(/```action\s*\n?[\s\S]*?\n?```/, '').trim();
  try {
    const action = JSON.parse(actionMatch[1].trim()) as AIAction;
    return { cleanText, action };
  } catch {
    return { cleanText: text.trim() };
  }
};

// ========== SPEECH-TO-TEXT ==========

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

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

// ========== COMPONENT ==========

const Chat: React.FC<ChatProps> = ({
  sessions, setSessions,
  leads, setLeads,
  tasks, setTasks,
  financialEntries, setFinancialEntries,
  contracts, user, activeTab,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const [currentSessionId, setCurrentSessionId] = useState<string>(sessions[0]?.id || 'new');
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession ? currentSession.messages : [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // ========== SESSION MANAGEMENT ==========

  const createNewSession = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: 'Nova Conversa',
      lastModified: Date.now(),
      messages: [{ id: 'init', sender: 'ai', text: 'Olá! Sou o ImobPilot AI, seu copiloto imobiliário. Como posso te ajudar agora?' }]
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
    setShowHistory(false);
  };

  // ========== EXECUTE ACTIONS ==========

  const executeAction = (action: AIAction, messageId: string) => {
    const today = new Date().toISOString().split('T')[0];

    switch (action.type) {
      case 'create_task': {
        const d = action.data as Record<string, string>;
        const newTask: Task = {
          id: `t-${Date.now()}`,
          title: d.title || 'Nova tarefa',
          description: d.description,
          completed: false,
          date: d.date || today,
          type: (d.type as Task['type']) || 'geral',
          leadId: d.leadId,
          createdAt: Date.now(),
        };
        setTasks(prev => [...prev, newTask]);
        break;
      }
      case 'create_lead': {
        const d = action.data as Record<string, string | number>;
        const newLead: Lead = {
          id: `l-${Date.now()}`,
          name: (d.name as string) || 'Novo Lead',
          phone: (d.phone as string) || '',
          status: (d.status as string) || 'Morno',
          value: (d.value as number) || 0,
          email: d.email as string,
          lastInteraction: today,
          properties: [],
          interactions: [],
        };
        setLeads(prev => [...prev, newLead]);
        break;
      }
      case 'create_financial': {
        const d = action.data as Record<string, string | number>;
        const newEntry: FinancialEntry = {
          id: `fe-${Date.now()}`,
          type: (d.type as 'receita' | 'despesa') || 'despesa',
          description: (d.description as string) || '',
          amount: (d.amount as number) || 0,
          category: (d.category as FinancialEntry['category']) || 'outro',
          date: (d.date as string) || today,
          createdAt: Date.now(),
        };
        setFinancialEntries(prev => [...prev, newEntry]);
        break;
      }
      case 'suggest_tasks': {
        const d = action.data as { tasks: { title: string; type: string }[] };
        if (d.tasks) {
          d.tasks.forEach((t, i) => {
            const newTask: Task = {
              id: `t-${Date.now()}-${i}`,
              title: t.title,
              completed: false,
              date: today,
              type: (t.type as Task['type']) || 'geral',
              createdAt: Date.now(),
            };
            setTasks(prev => [...prev, newTask]);
          });
        }
        break;
      }
    }

    // Mark action as executed
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        return {
          ...s,
          messages: s.messages.map(m =>
            m.id === messageId ? { ...m, actionExecuted: true } : m
          )
        };
      }
      return s;
    }));
  };

  // ========== SEND MESSAGE ==========

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isTyping) return;

    let targetSessionId = currentSessionId;
    if (!currentSession) {
      createNewSession();
      return;
    }

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
    };

    // Add user message
    const updatedMessages = [...messages, userMsg];
    setSessions(prev => prev.map(s => s.id === targetSessionId ? {
      ...s,
      title: s.messages.length <= 1 ? text.trim().slice(0, 25) + '...' : s.title,
      lastModified: Date.now(),
      messages: updatedMessages,
    } : s));

    setInput('');
    setIsTyping(true);

    // Call AI
    const systemPrompt = buildSystemPrompt(user, leads, tasks, financialEntries, contracts);
    const responseText = await callGeminiAPI(updatedMessages, systemPrompt);

    const { cleanText, action } = parseActionFromResponse(responseText);

    const aiMsg: ChatMessage = {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: cleanText,
      action,
      actionExecuted: false,
    };

    setSessions(prev => prev.map(s => s.id === targetSessionId ? {
      ...s,
      lastModified: Date.now(),
      messages: [...s.messages.filter(m => m.id !== userMsg.id), userMsg, aiMsg],
    } : s));

    setIsTyping(false);
  };

  // ========== SPEECH-TO-TEXT ==========

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Seu navegador não suporta reconhecimento de voz.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev ? prev + ' ' + transcript : transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  // ========== ACTION CARD ==========

  const ActionCard: React.FC<{ action: AIAction; messageId: string; executed?: boolean }> = ({ action, messageId, executed }) => {
    const getActionLabel = () => {
      switch (action.type) {
        case 'create_task': {
          const d = action.data as Record<string, string>;
          return `Criar tarefa: "${d.title}"`;
        }
        case 'create_lead': {
          const d = action.data as Record<string, string>;
          return `Criar lead: "${d.name}"`;
        }
        case 'create_financial': {
          const d = action.data as Record<string, string | number>;
          return `Criar lançamento: "${d.description}" — R$ ${Number(d.amount).toLocaleString('pt-BR')}`;
        }
        case 'suggest_tasks': {
          const d = action.data as { tasks: { title: string }[] };
          return `Adicionar ${d.tasks?.length || 0} tarefas sugeridas`;
        }
        default: return 'Ação sugerida';
      }
    };

    const getActionIcon = () => {
      switch (action.type) {
        case 'create_task': return 'task_alt';
        case 'create_lead': return 'person_add';
        case 'create_financial': return 'payments';
        case 'suggest_tasks': return 'checklist';
        default: return 'auto_awesome';
      }
    };

    if (executed) {
      return (
        <div className="mt-3 bg-emerald-50 rounded-xl p-3 border border-emerald-200 flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-600 text-lg filled">check_circle</span>
          <span className="text-sm text-emerald-700 font-medium">Ação executada com sucesso!</span>
        </div>
      );
    }

    return (
      <div className="mt-3 bg-indigo-50 rounded-xl p-3 border border-indigo-200">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-indigo-600 text-lg">{getActionIcon()}</span>
          <span className="text-sm text-indigo-800 font-medium">{getActionLabel()}</span>
        </div>

        {action.type === 'suggest_tasks' && (
          <div className="mb-2 space-y-1">
            {((action.data as { tasks: { title: string; type: string }[] }).tasks || []).map((t, i) => (
              <div key={i} className="text-xs text-indigo-600 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">arrow_right</span>
                {t.title}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => executeAction(action, messageId)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">check</span>
            {action.type === 'suggest_tasks' ? 'Adicionar Todas' : 'Criar'}
          </button>
          <button
            onClick={() => {
              // Mark as executed (dismissed) without action
              setSessions(prev => prev.map(s => ({
                ...s,
                messages: s.messages.map(m => m.id === messageId ? { ...m, actionExecuted: true } : m)
              })));
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-500 rounded-lg text-xs font-medium border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Ignorar
          </button>
        </div>
      </div>
    );
  };

  // ========== RENDER ==========

  return (
    <div className="flex h-full bg-slate-100 relative overflow-hidden">

      {/* Sidebar / History Drawer */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ${showHistory ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 md:w-72 flex flex-col`}>
        <div className="p-4 border-b border-slate-100 flex justify-between items-center pt-6">
          <h2 className="font-bold text-slate-800">Histórico</h2>
          <button onClick={() => setShowHistory(false)} className="md:hidden p-2 text-slate-400">
            <span className="material-symbols-outlined">close</span>
          </button>
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

      {/* Overlay for mobile sidebar */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/30 z-20 md:hidden" onClick={() => setShowHistory(false)} />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Header */}
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
                  <span className={`w-1.5 h-1.5 rounded-full ${isTyping ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`}></span>
                  <p className="text-xs text-slate-500 font-medium">{isTyping ? 'Digitando...' : 'Online'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4 pb-40 md:pb-24">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-[70%] ${msg.sender === 'user' ? '' : ''}`}>
                <div className={`p-4 rounded-2xl text-sm md:text-base leading-relaxed shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-primary text-white rounded-br-none'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>

                {/* Action Card */}
                {msg.action && (
                  <ActionCard action={msg.action} messageId={msg.id} executed={msg.actionExecuted} />
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start w-full">
              <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none border border-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-accent rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 pt-3 pb-safe-bottom z-20 pb-20 md:pb-6">
          <div className="flex items-end gap-2 max-w-4xl mx-auto mb-2">
            {/* Mic Button */}
            <button
              onClick={toggleListening}
              className={`h-12 w-12 rounded-full flex items-center justify-center transition-all shrink-0 active:scale-95 ${
                isListening
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/40 animate-pulse'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              <span className="material-symbols-outlined">{isListening ? 'stop' : 'mic'}</span>
            </button>

            {/* Text Input */}
            <div className="flex-1 bg-slate-50 border border-slate-200 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent rounded-2xl px-4 py-3 transition-all">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? 'Ouvindo...' : 'Digite sua dúvida ou comando...'}
                rows={1}
                className="w-full border-none bg-transparent resize-none focus:ring-0 text-sm p-0 placeholder-slate-400 text-slate-800 max-h-24 focus:outline-none"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              />
            </div>

            {/* Send Button */}
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="h-12 w-12 rounded-full bg-accent text-white flex items-center justify-center shadow-lg shadow-accent/30 disabled:opacity-50 disabled:shadow-none hover:bg-indigo-700 transition-all active:scale-95 shrink-0"
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
