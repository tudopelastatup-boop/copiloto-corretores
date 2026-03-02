import React, { useState, useMemo } from 'react';
import {
  FinancialEntry, FinancialCategory, Lead,
  FINANCIAL_CATEGORY_LABELS, FINANCIAL_CATEGORY_ICONS,
  RECEITA_CATEGORIES, DESPESA_CATEGORIES,
} from '../types';

interface FinanceiroProps {
  entries: FinancialEntry[];
  setEntries: React.Dispatch<React.SetStateAction<FinancialEntry[]>>;
  leads: Lead[];
}

type FilterType = 'todos' | 'receita' | 'despesa';

const Financeiro: React.FC<FinanceiroProps> = ({ entries, setEntries, leads }) => {
  const today = new Date().toISOString().split('T')[0];

  // ── State ─────────────────────────────────────────
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [filterType, setFilterType] = useState<FilterType>('todos');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FinancialEntry | null>(null);

  // Form
  const [formType, setFormType] = useState<'receita' | 'despesa'>('receita');
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState<FinancialCategory>('comissao');
  const [formDate, setFormDate] = useState(today);
  const [formLeadId, setFormLeadId] = useState('');

  // Confirm delete
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // ── Computed ──────────────────────────────────────
  const monthKey = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}`;

  const monthEntries = useMemo(() =>
    entries.filter(e => e.date.startsWith(monthKey)),
    [entries, monthKey]
  );

  const filteredEntries = useMemo(() => {
    let result = monthEntries;
    if (filterType !== 'todos') result = result.filter(e => e.type === filterType);
    return result.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  }, [monthEntries, filterType]);

  const totalReceita = useMemo(() =>
    monthEntries.filter(e => e.type === 'receita').reduce((s, e) => s + e.amount, 0),
    [monthEntries]
  );
  const totalDespesa = useMemo(() =>
    monthEntries.filter(e => e.type === 'despesa').reduce((s, e) => s + e.amount, 0),
    [monthEntries]
  );
  const saldo = totalReceita - totalDespesa;

  // Group by date
  const groupedEntries = useMemo(() => {
    const groups: { date: string; entries: FinancialEntry[] }[] = [];
    filteredEntries.forEach(entry => {
      const existing = groups.find(g => g.date === entry.date);
      if (existing) { existing.entries.push(entry); }
      else { groups.push({ date: entry.date, entries: [entry] }); }
    });
    return groups;
  }, [filteredEntries]);

  // ── Helpers ───────────────────────────────────────
  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const formatDateLabel = (dateStr: string) => {
    if (dateStr === today) return 'Hoje';
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    if (dateStr === yesterday.toISOString().split('T')[0]) return 'Ontem';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
  };

  const getLeadName = (leadId?: string) => {
    if (!leadId) return null;
    return leads.find(l => l.id === leadId)?.name || null;
  };

  const monthLabel = new Date(selectedMonth.year, selectedMonth.month)
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const changeMonth = (delta: number) => {
    setSelectedMonth(prev => {
      let m = prev.month + delta;
      let y = prev.year;
      if (m > 11) { m = 0; y++; }
      if (m < 0) { m = 11; y--; }
      return { year: y, month: m };
    });
  };

  const categoriesForType = formType === 'receita' ? RECEITA_CATEGORIES : DESPESA_CATEGORIES;

  // ── CRUD ──────────────────────────────────────────
  const resetForm = () => {
    setFormType('receita');
    setFormDescription('');
    setFormAmount('');
    setFormCategory('comissao');
    setFormDate(today);
    setFormLeadId('');
  };

  const openAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEdit = (entry: FinancialEntry) => {
    setEditingEntry(entry);
    setFormType(entry.type);
    setFormDescription(entry.description);
    setFormAmount(String(entry.amount));
    setFormCategory(entry.category);
    setFormDate(entry.date);
    setFormLeadId(entry.leadId || '');
    setShowEditModal(true);
  };

  const saveEntry = (isEdit: boolean) => {
    const amount = parseFloat(formAmount);
    if (!formDescription.trim() || isNaN(amount) || amount <= 0) return;

    const data: FinancialEntry = {
      id: isEdit && editingEntry ? editingEntry.id : Date.now().toString(),
      type: formType,
      description: formDescription.trim(),
      amount,
      category: formCategory,
      date: formDate,
      leadId: formLeadId || undefined,
      createdAt: isEdit && editingEntry ? editingEntry.createdAt : Date.now(),
    };

    if (isEdit && editingEntry) {
      setEntries(prev => prev.map(e => e.id === editingEntry.id ? data : e));
    } else {
      setEntries(prev => [...prev, data]);
    }
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingEntry(null);
  };

  const deleteEntry = () => {
    if (confirmDelete) {
      setEntries(prev => prev.filter(e => e.id !== confirmDelete));
    }
    setConfirmDelete(null);
  };

  // ── Form Component ────────────────────────────────
  const EntryForm = () => (
    <div className="space-y-3">
      {/* Type Toggle */}
      <div className="flex bg-slate-100 rounded-xl p-1">
        <button onClick={() => { setFormType('receita'); setFormCategory('comissao'); }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${formType === 'receita' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500'}`}>
          Receita
        </button>
        <button onClick={() => { setFormType('despesa'); setFormCategory('combustivel'); }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${formType === 'despesa' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500'}`}>
          Despesa
        </button>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Descrição *</label>
        <input type="text" value={formDescription} onChange={e => setFormDescription(e.target.value)}
          placeholder="Ex: Comissão venda apto Leblon"
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-accent" autoFocus />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Valor (R$) *</label>
          <input type="number" value={formAmount} onChange={e => setFormAmount(e.target.value)}
            placeholder="0,00" step="0.01" min="0"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-accent" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Data</label>
          <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-accent" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Categoria</label>
        <div className="flex flex-wrap gap-2">
          {categoriesForType.map(cat => (
            <button key={cat} type="button" onClick={() => setFormCategory(cat)}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                formCategory === cat ? 'bg-primary text-white border-primary' : 'bg-white text-slate-500 border-slate-200'
              }`}>
              <span className="material-symbols-outlined text-sm">{FINANCIAL_CATEGORY_ICONS[cat]}</span>
              {FINANCIAL_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Lead Vinculado</label>
        <select value={formLeadId} onChange={e => setFormLeadId(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-accent">
          <option value="">Nenhum</option>
          {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-28 md:pb-6">

      {/* Header Mobile */}
      <header className="bg-white px-6 pt-6 pb-4 border-b border-slate-100 sticky top-0 z-10 md:hidden">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-primary tracking-tight">Financeiro</h1>
            <p className="text-sm text-slate-500">Controle suas finanças.</p>
          </div>
          <button onClick={openAdd} className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 active:scale-95">
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
      </header>

      {/* Header Desktop */}
      <header className="hidden md:flex bg-white px-8 py-8 border-b border-slate-100 justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Financeiro</h1>
          <p className="text-slate-500 mt-1">Controle suas finanças.</p>
        </div>
        <button onClick={openAdd} className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium shadow-lg shadow-primary/20 flex items-center gap-2 active:scale-95">
          <span className="material-symbols-outlined text-lg">add</span> Novo Lançamento
        </button>
      </header>

      <div className="p-4 md:p-8 space-y-4 md:space-y-6 max-w-3xl mx-auto">

        {/* Month Navigator */}
        <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-500">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <h3 className="text-sm font-bold text-slate-900 capitalize">{monthLabel}</h3>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-500">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>

        {/* Summary Card */}
        <div className="bg-primary rounded-2xl p-5 text-white shadow-float relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 opacity-5">
            <span className="material-symbols-outlined text-[120px]">account_balance</span>
          </div>
          <div className="relative z-10">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Saldo do Mês</p>
            <p className={`text-3xl font-bold mb-4 ${saldo >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCurrency(saldo)}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Receitas</p>
                <p className="text-lg font-bold text-emerald-400">{formatCurrency(totalReceita)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Despesas</p>
                <p className="text-lg font-bold text-red-400">{formatCurrency(totalDespesa)}</p>
              </div>
            </div>
            {/* Bar visual */}
            {(totalReceita + totalDespesa) > 0 && (
              <div className="mt-3 flex h-2 rounded-full overflow-hidden bg-white/10">
                <div className="bg-emerald-400 transition-all" style={{ width: `${(totalReceita / (totalReceita + totalDespesa)) * 100}%` }} />
                <div className="bg-red-400 transition-all" style={{ width: `${(totalDespesa / (totalReceita + totalDespesa)) * 100}%` }} />
              </div>
            )}
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2">
          {([
            { key: 'todos', label: 'Todos' },
            { key: 'receita', label: 'Receitas' },
            { key: 'despesa', label: 'Despesas' },
          ] as { key: FilterType; label: string }[]).map(f => (
            <button key={f.key} onClick={() => setFilterType(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                filterType === f.key ? 'bg-primary text-white border-primary' : 'bg-white text-slate-500 border-slate-200'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Grouped Entries List */}
        {groupedEntries.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-20">receipt_long</span>
            <p className="text-sm">Nenhum lançamento neste mês.</p>
            <button onClick={openAdd} className="mt-2 text-accent text-xs font-medium hover:underline">
              Adicionar lançamento
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedEntries.map(group => (
              <div key={group.date}>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                  {formatDateLabel(group.date)}
                </p>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
                  {group.entries.map(entry => {
                    const leadName = getLeadName(entry.leadId);
                    return (
                      <div key={entry.id} onClick={() => openEdit(entry)}
                        className="p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors group">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          entry.type === 'receita' ? 'bg-emerald-50' : 'bg-red-50'
                        }`}>
                          <span className={`material-symbols-outlined text-lg ${
                            entry.type === 'receita' ? 'text-emerald-600' : 'text-red-500'
                          }`}>
                            {FINANCIAL_CATEGORY_ICONS[entry.category]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{entry.description}</p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <span>{FINANCIAL_CATEGORY_LABELS[entry.category]}</span>
                            {leadName && (
                              <><span className="w-1 h-1 bg-slate-300 rounded-full" /><span>{leadName}</span></>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-sm font-bold ${entry.type === 'receita' ? 'text-emerald-600' : 'text-red-500'}`}>
                            {entry.type === 'receita' ? '+' : '-'} {formatCurrency(entry.amount)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDelete(entry.id); }}
                          className="text-slate-300 hover:text-red-500 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add button (mobile, bottom) */}
        <button onClick={openAdd}
          className="w-full flex items-center justify-center gap-2 p-3 bg-white rounded-xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-accent hover:text-accent transition-colors text-sm font-medium md:hidden">
          <span className="material-symbols-outlined text-lg">add</span>
          Novo Lançamento
        </button>
      </div>

      {/* ── MODALS ──────────────────────────────────── */}

      {/* Add Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
          <div className="bg-white w-full max-w-md rounded-t-3xl md:rounded-2xl p-6 shadow-2xl animate-[slideUp_0.3s_ease-out] md:animate-[fadeIn_0.2s_ease-out] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 md:hidden" />
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-accent">add_card</span> Novo Lançamento
            </h2>
            <EntryForm />
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 text-slate-500 font-medium hover:bg-slate-50 rounded-xl text-sm">Cancelar</button>
              <button onClick={() => saveEntry(false)} disabled={!formDescription.trim() || !formAmount}
                className="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 text-sm disabled:opacity-50">Adicionar</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Entry Modal */}
      {showEditModal && editingEntry && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => { setShowEditModal(false); setEditingEntry(null); }}>
          <div className="bg-white w-full max-w-md rounded-t-3xl md:rounded-2xl p-6 shadow-2xl animate-[slideUp_0.3s_ease-out] md:animate-[fadeIn_0.2s_ease-out] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 md:hidden" />
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-accent">edit</span> Editar Lançamento
            </h2>
            <EntryForm />
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowEditModal(false); setEditingEntry(null); }} className="flex-1 py-2.5 text-slate-500 font-medium hover:bg-slate-50 rounded-xl text-sm">Cancelar</button>
              <button onClick={() => saveEntry(true)} disabled={!formDescription.trim() || !formAmount}
                className="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 text-sm disabled:opacity-50">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl animate-[fadeIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-red-500 text-2xl">delete</span>
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-1">Excluir lançamento?</h3>
              <p className="text-sm text-slate-500 mb-4">Essa ação não pode ser desfeita.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 text-slate-500 font-medium hover:bg-slate-50 rounded-xl text-sm">Cancelar</button>
              <button onClick={deleteEntry} className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl text-sm">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Financeiro;
