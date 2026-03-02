import React, { useMemo } from 'react';
import { Task, Lead, FinancialEntry, NavigationItem } from '../types';

interface DashboardProps {
  tasks: Task[];
  leads: Lead[];
  financialEntries: FinancialEntry[];
  userName: string;
  onNavigate: (tab: NavigationItem) => void;
}

// ── Motivational Quotes ──────────────────────────────────
const QUOTES = [
  { text: 'O sucesso não é o final, o fracasso não é fatal: é a coragem de continuar que conta.', author: 'Winston Churchill' },
  { text: 'Cada imóvel vendido é um sonho realizado. Continue transformando sonhos em realidade.', author: 'ImobPilot' },
  { text: 'O segredo do sucesso é começar antes de estar pronto.', author: 'Marie Forleo' },
  { text: 'Não é sobre ter tempo, é sobre fazer tempo.', author: 'Desconhecido' },
  { text: 'O corretor que mais prospecta é o que mais fecha.', author: 'ImobPilot' },
  { text: 'Disciplina é a ponte entre metas e conquistas.', author: 'Jim Rohn' },
  { text: 'A persistência é o caminho do êxito.', author: 'Charles Chaplin' },
];

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
};

const getDailyQuote = () => {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return QUOTES[dayOfYear % QUOTES.length];
};

// ── SVG Chart Components ─────────────────────────────────

const LineChart: React.FC<{ data: number[]; labels: string[] }> = ({ data, labels }) => {
  const max = Math.max(...data, 1);
  const w = 280;
  const h = 120;
  const padX = 30;
  const padY = 20;
  const chartW = w - padX * 2;
  const chartH = h - padY * 2;

  const points = data.map((v, i) => {
    const x = padX + (i / Math.max(data.length - 1, 1)) * chartW;
    const y = padY + chartH - (v / max) * chartH;
    return { x, y, v };
  });

  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');
  const areaPath = `M${points[0].x},${h - padY} ${points.map(p => `L${p.x},${p.y}`).join(' ')} L${points[points.length - 1].x},${h - padY} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
        <line key={i} x1={padX} y1={padY + chartH * (1 - pct)} x2={w - padX} y2={padY + chartH * (1 - pct)} stroke="#e2e8f0" strokeWidth="0.5" />
      ))}
      {/* Area fill */}
      <path d={areaPath} fill="url(#lineGrad)" />
      {/* Line */}
      <polyline points={polyline} fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3.5" fill="white" stroke="#4f46e5" strokeWidth="2" />
          <text x={p.x} y={h - 4} textAnchor="middle" className="text-[8px] fill-slate-400">{labels[i]}</text>
        </g>
      ))}
    </svg>
  );
};

const DonutChart: React.FC<{ segments: { label: string; value: number; color: string }[] }> = ({ segments }) => {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return <div className="text-center text-slate-400 text-sm py-8">Sem dados</div>;

  const size = 120;
  const cx = size / 2;
  const cy = size / 2;
  const r = 42;
  const strokeW = 16;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-28 h-28">
        {segments.filter(s => s.value > 0).map((seg, i) => {
          const pct = seg.value / total;
          const dash = pct * circumference;
          const currentOffset = offset;
          offset += dash;
          return (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeW}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-currentOffset}
              transform={`rotate(-90 ${cx} ${cy})`}
              className="transition-all duration-700"
            />
          );
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" className="text-lg font-bold fill-slate-900">{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" className="text-[8px] fill-slate-400">leads</text>
      </svg>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
        {segments.filter(s => s.value > 0).map((seg, i) => (
          <div key={i} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-[10px] text-slate-500">{seg.label} ({seg.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const BarChart: React.FC<{ data: { label: string; receita: number; despesa: number }[] }> = ({ data }) => {
  const allValues = data.flatMap(d => [d.receita, d.despesa]);
  const max = Math.max(...allValues, 1);
  const w = 280;
  const h = 130;
  const padX = 10;
  const padY = 15;
  const padBottom = 20;
  const chartH = h - padY - padBottom;
  const barGroupW = (w - padX * 2) / data.length;
  const barW = barGroupW * 0.3;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
      {/* Grid lines */}
      {[0, 0.5, 1].map((pct, i) => (
        <line key={i} x1={padX} y1={padY + chartH * (1 - pct)} x2={w - padX} y2={padY + chartH * (1 - pct)} stroke="#e2e8f0" strokeWidth="0.5" />
      ))}
      {data.map((d, i) => {
        const gx = padX + i * barGroupW + barGroupW / 2;
        const rH = (d.receita / max) * chartH;
        const dH = (d.despesa / max) * chartH;
        return (
          <g key={i}>
            {/* Receita bar */}
            <rect x={gx - barW - 1} y={padY + chartH - rH} width={barW} height={rH} rx="2" fill="#10b981" opacity="0.85" />
            {/* Despesa bar */}
            <rect x={gx + 1} y={padY + chartH - dH} width={barW} height={dH} rx="2" fill="#ef4444" opacity="0.85" />
            {/* Label */}
            <text x={gx} y={h - 4} textAnchor="middle" className="text-[8px] fill-slate-400">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
};

// ── Main Dashboard Component ─────────────────────────────

const Dashboard: React.FC<DashboardProps> = ({ tasks, leads, financialEntries, userName, onNavigate }) => {
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.slice(0, 7);
  const quote = getDailyQuote();
  const greeting = getGreeting();
  const firstName = userName.split(' ')[0];

  // ── Metrics ──────────────────────────────────────────
  const metrics = useMemo(() => {
    const activeLeads = leads.filter(l => l.status !== 'Fechado').length;
    const closedLeads = leads.filter(l => l.status === 'Fechado').length;
    const conversionRate = leads.length > 0 ? Math.round((closedLeads / leads.length) * 100) : 0;

    const todayTasks = tasks.filter(t => t.date === today);
    const todayCompleted = todayTasks.filter(t => t.completed).length;

    const monthRevenue = financialEntries
      .filter(e => e.type === 'receita' && e.date.startsWith(currentMonth))
      .reduce((sum, e) => sum + e.amount, 0);

    return { activeLeads, conversionRate, todayTasks: todayTasks.length, todayCompleted, monthRevenue };
  }, [tasks, leads, financialEntries, today, currentMonth]);

  // ── Weekly Performance (line chart) ──────────────────
  const weeklyData = useMemo(() => {
    const labels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const data = labels.map((_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() + mondayOffset + i);
      const dateStr = d.toISOString().split('T')[0];
      return tasks.filter(t => t.date === dateStr && t.completed).length;
    });

    return { labels, data };
  }, [tasks]);

  // ── Leads by Status (donut) ──────────────────────────
  const leadsDonut = useMemo(() => {
    const statusColors: Record<string, string> = {
      'Quente': '#ef4444',
      'Morno': '#f59e0b',
      'Frio': '#94a3b8',
      'Fechado': '#10b981',
    };

    const counts: Record<string, number> = {};
    leads.forEach(l => {
      counts[l.status] = (counts[l.status] || 0) + 1;
    });

    return Object.entries(counts).map(([label, value]) => ({
      label,
      value,
      color: statusColors[label] || '#6366f1',
    }));
  }, [leads]);

  // ── Financial Bar Chart (last 3 months) ──────────────
  const financialBars = useMemo(() => {
    const months: { label: string; key: string }[] = [];
    for (let i = 2; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({
        label: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        key: d.toISOString().slice(0, 7),
      });
    }

    return months.map(m => {
      const receita = financialEntries
        .filter(e => e.type === 'receita' && e.date.startsWith(m.key))
        .reduce((s, e) => s + e.amount, 0);
      const despesa = financialEntries
        .filter(e => e.type === 'despesa' && e.date.startsWith(m.key))
        .reduce((s, e) => s + e.amount, 0);
      return { label: m.label, receita, despesa };
    });
  }, [financialEntries]);

  // ── Productivity (week) ──────────────────────────────
  const productivity = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    let weekTotal = 0;
    let weekCompleted = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + mondayOffset + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayTasks = tasks.filter(t => t.date === dateStr);
      weekTotal += dayTasks.length;
      weekCompleted += dayTasks.filter(t => t.completed).length;
    }

    const pct = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;
    return { weekTotal, weekCompleted, pct };
  }, [tasks]);

  const formatCurrency = (v: number): string => {
    if (v >= 1000) return `R$ ${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`;
    return `R$ ${v}`;
  };

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-28 md:pb-6 relative">

      {/* ── Header Mobile ───────────────────────────── */}
      <header className="bg-white px-6 pt-6 pb-4 border-b border-slate-100 sticky top-0 z-10 md:hidden">
        <p className="text-slate-500 text-sm font-medium">{greeting},</p>
        <h1 className="text-slate-900 text-2xl font-bold tracking-tight">{firstName}</h1>
      </header>

      {/* ── Header Desktop ──────────────────────────── */}
      <header className="hidden md:flex bg-white px-8 py-8 border-b border-slate-100 justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">Visão geral da sua performance.</p>
        </div>
      </header>

      <div className="p-4 md:p-8 space-y-4 md:space-y-6 max-w-5xl mx-auto">

        {/* ── Motivational Quote ───────────────────── */}
        <div className="bg-primary rounded-2xl p-4 md:p-6 text-white relative overflow-hidden shadow-float">
          <div className="absolute -right-4 -bottom-8 opacity-5">
            <span className="material-symbols-outlined text-[150px]">format_quote</span>
          </div>
          <div className="relative z-10">
            <p className="text-base md:text-xl font-medium leading-relaxed opacity-90 mb-3">
              "{quote.text}"
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold uppercase tracking-widest">
              <span className="w-6 h-[2px] bg-accent"></span>
              {quote.author}
            </div>
          </div>
        </div>

        {/* ── Metric Cards (2x2 grid) ─────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {/* Comissão do Mês */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-accent/30 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-emerald-500 text-lg">payments</span>
              <p className="text-[10px] md:text-xs text-slate-400 font-semibold uppercase tracking-wider">Comissão</p>
            </div>
            <p className="text-xl md:text-2xl font-bold text-slate-900">{formatCurrency(metrics.monthRevenue)}</p>
            <span className="text-[10px] text-slate-400 font-medium">este mês</span>
          </div>

          {/* Leads Ativos */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-accent/30 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-blue-500 text-lg">groups</span>
              <p className="text-[10px] md:text-xs text-slate-400 font-semibold uppercase tracking-wider">Leads</p>
            </div>
            <p className="text-xl md:text-2xl font-bold text-slate-900">{metrics.activeLeads}</p>
            <span className="text-[10px] text-slate-400 font-medium">ativos</span>
          </div>

          {/* Tarefas Hoje */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-accent/30 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-amber-500 text-lg">task_alt</span>
              <p className="text-[10px] md:text-xs text-slate-400 font-semibold uppercase tracking-wider">Tarefas</p>
            </div>
            <p className="text-xl md:text-2xl font-bold text-slate-900">
              {metrics.todayCompleted}<span className="text-sm text-slate-400 font-normal">/{metrics.todayTasks}</span>
            </p>
            <span className="text-[10px] text-slate-400 font-medium">concluídas hoje</span>
          </div>

          {/* Taxa de Conversão */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-accent/30 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-violet-500 text-lg">trending_up</span>
              <p className="text-[10px] md:text-xs text-slate-400 font-semibold uppercase tracking-wider">Conversão</p>
            </div>
            <p className="text-xl md:text-2xl font-bold text-slate-900">{metrics.conversionRate}%</p>
            <span className="text-[10px] text-slate-400 font-medium">leads fechados</span>
          </div>
        </div>

        {/* ── Charts Row ──────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Line Chart - Performance Semanal */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-accent text-lg">show_chart</span>
                Performance Semanal
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">Tarefas concluídas</span>
            </div>
            <LineChart data={weeklyData.data} labels={weeklyData.labels} />
          </div>

          {/* Donut Chart - Status dos Leads */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-accent text-lg">donut_large</span>
                Leads por Status
              </h3>
            </div>
            <DonutChart segments={leadsDonut} />
          </div>

          {/* Bar Chart - Financeiro */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-accent text-lg">bar_chart</span>
                Financeiro Mensal
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-slate-400">Receita</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-[10px] text-slate-400">Despesa</span>
                </div>
              </div>
            </div>
            <BarChart data={financialBars} />
          </div>

          {/* Productivity Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 md:p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-accent text-lg">speed</span>
                Produtividade
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">Esta semana</span>
            </div>
            <div className="flex items-center gap-5">
              {/* Circular Progress */}
              <div className="relative shrink-0">
                <svg viewBox="0 0 80 80" className="w-20 h-20">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                  <circle
                    cx="40" cy="40" r="32"
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(productivity.pct / 100) * 201} 201`}
                    transform="rotate(-90 40 40)"
                    className="transition-all duration-700"
                  />
                  <text x="40" y="38" textAnchor="middle" className="text-lg font-bold fill-slate-900">{productivity.pct}%</text>
                  <text x="40" y="50" textAnchor="middle" className="text-[8px] fill-slate-400">concluído</text>
                </svg>
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Concluídas</p>
                  <p className="text-lg font-bold text-slate-900">{productivity.weekCompleted} <span className="text-sm font-normal text-slate-400">de {productivity.weekTotal}</span></p>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-700"
                    style={{ width: `${productivity.pct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Quick Actions ───────────────────────── */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400 text-lg">bolt</span>
            Ações Rápidas
          </h3>
          <div className="grid grid-cols-4 gap-2 md:gap-3">
            <button
              onClick={() => onNavigate('leads')}
              className="flex flex-col items-center gap-1.5 p-3 md:p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-accent/30 hover:shadow-md transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-blue-500 text-xl md:text-2xl">person_add</span>
              <span className="text-[10px] md:text-xs font-medium text-slate-600">Novo Lead</span>
            </button>
            <button
              onClick={() => onNavigate('home')}
              className="flex flex-col items-center gap-1.5 p-3 md:p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-accent/30 hover:shadow-md transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-amber-500 text-xl md:text-2xl">add_task</span>
              <span className="text-[10px] md:text-xs font-medium text-slate-600">Nova Tarefa</span>
            </button>
            <button
              onClick={() => onNavigate('goals')}
              className="flex flex-col items-center gap-1.5 p-3 md:p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-accent/30 hover:shadow-md transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-emerald-500 text-xl md:text-2xl">account_balance_wallet</span>
              <span className="text-[10px] md:text-xs font-medium text-slate-600">Lançamento</span>
            </button>
            <button
              onClick={() => onNavigate('copilot')}
              className="flex flex-col items-center gap-1.5 p-3 md:p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-accent/30 hover:shadow-md transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-violet-500 text-xl md:text-2xl">smart_toy</span>
              <span className="text-[10px] md:text-xs font-medium text-slate-600">Copiloto IA</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
