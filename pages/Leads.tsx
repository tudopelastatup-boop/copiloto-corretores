import React, { useState, useMemo } from 'react';
import {
  Lead, Task, InteractionType, LeadProperty, Interaction,
  INTERACTION_TYPE_LABELS, INTERACTION_TYPE_ICONS,
  TASK_TYPE_LABELS, TASK_TYPE_COLORS, TASK_TYPE_ICONS, TaskType,
} from '../types';

interface LeadsProps {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  statuses: string[];
  setStatuses: React.Dispatch<React.SetStateAction<string[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const Leads: React.FC<LeadsProps> = ({ leads, setLeads, statuses, setStatuses, tasks, setTasks }) => {
  const today = new Date().toISOString().split('T')[0];

  // ── List view state ───────────────────────────────
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // ── Detail view state ─────────────────────────────
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddInteraction, setShowAddInteraction] = useState(false);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);

  // ── Form state ────────────────────────────────────
  const [formData, setFormData] = useState<Partial<Lead>>({
    name: '', status: statuses[0] || 'Frio', value: 0, phone: '', email: '', birthday: '', notes: '',
  });
  const [interactionForm, setInteractionForm] = useState<{ type: InteractionType; description: string; date: string }>({
    type: 'ligacao', description: '', date: today,
  });
  const [propertyForm, setPropertyForm] = useState<Partial<LeadProperty>>({
    title: '', location: '', value: 0, notes: '',
  });
  const [taskForm, setTaskForm] = useState<{ title: string; type: TaskType; date: string }>({
    title: '', type: 'follow_up', date: today,
  });

  // ── Status management ─────────────────────────────
  const [newStatusName, setNewStatusName] = useState('');
  const [editingStatusIndex, setEditingStatusIndex] = useState<number | null>(null);
  const [editStatusText, setEditStatusText] = useState('');

  // ── Confirm modal ─────────────────────────────────
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; title: string; message: string; action: () => void }>({
    show: false, title: '', message: '', action: () => {},
  });

  // ── Computed ──────────────────────────────────────
  const selectedLead = selectedLeadId ? leads.find(l => l.id === selectedLeadId) : null;

  const filteredLeads = useMemo(() => {
    let result = leads;
    if (filterStatus !== 'Todos') {
      result = result.filter(l => l.status === filterStatus);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        l.name.toLowerCase().includes(q) || l.phone.includes(q) || (l.email && l.email.toLowerCase().includes(q))
      );
    }
    return result;
  }, [leads, filterStatus, search]);

  const leadTasks = useMemo(() => {
    if (!selectedLeadId) return [];
    return tasks.filter(t => t.leadId === selectedLeadId);
  }, [tasks, selectedLeadId]);

  // ── Helpers ───────────────────────────────────────
  const getStatusColor = (status: string) => {
    if (status.toLowerCase().includes('quen')) return 'bg-red-50 text-red-600 border-red-100';
    if (status.toLowerCase().includes('morn')) return 'bg-amber-50 text-amber-600 border-amber-100';
    if (status.toLowerCase().includes('fech')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (status.toLowerCase().includes('frio')) return 'bg-slate-100 text-slate-500 border-slate-200';
    return 'bg-indigo-50 text-indigo-600 border-indigo-100';
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // ── Lead CRUD ─────────────────────────────────────
  const openAddLead = () => {
    setFormData({ name: '', status: statuses[0] || 'Frio', value: 0, phone: '', email: '', birthday: '', notes: '' });
    setShowAddModal(true);
  };

  const openEditLead = () => {
    if (!selectedLead) return;
    setFormData({ ...selectedLead });
    setShowEditModal(true);
  };

  const saveLead = (isEdit: boolean) => {
    if (!formData.name || !formData.phone) return;
    if (isEdit && selectedLeadId) {
      setLeads(prev => prev.map(l => l.id === selectedLeadId ? { ...l, ...formData } as Lead : l));
    } else {
      const newLead: Lead = {
        ...formData as Lead,
        id: Date.now().toString(),
        properties: [],
        interactions: [],
        lastInteraction: today,
      };
      setLeads(prev => [...prev, newLead]);
    }
    setShowAddModal(false);
    setShowEditModal(false);
  };

  const requestDeleteLead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({
      show: true, title: 'Excluir Cliente',
      message: 'Tem certeza que deseja remover este cliente permanentemente?',
      action: () => {
        setLeads(prev => prev.filter(l => l.id !== id));
        if (selectedLeadId === id) setSelectedLeadId(null);
        setConfirmModal(prev => ({ ...prev, show: false }));
      },
    });
  };

  // ── Interaction CRUD ──────────────────────────────
  const addInteraction = () => {
    if (!selectedLeadId || !interactionForm.description.trim()) return;
    const newInteraction: Interaction = {
      id: Date.now().toString(),
      date: interactionForm.date,
      type: interactionForm.type,
      description: interactionForm.description.trim(),
      createdAt: Date.now(),
    };
    setLeads(prev => prev.map(l => l.id === selectedLeadId ? {
      ...l,
      interactions: [newInteraction, ...l.interactions],
      lastInteraction: interactionForm.date > l.lastInteraction ? interactionForm.date : l.lastInteraction,
    } : l));
    setInteractionForm({ type: 'ligacao', description: '', date: today });
    setShowAddInteraction(false);
  };

  // ── Property CRUD ─────────────────────────────────
  const addProperty = () => {
    if (!selectedLeadId || !propertyForm.title?.trim()) return;
    const newProp: LeadProperty = {
      id: Date.now().toString(),
      title: propertyForm.title.trim(),
      location: propertyForm.location || undefined,
      value: propertyForm.value || undefined,
      notes: propertyForm.notes || undefined,
    };
    setLeads(prev => prev.map(l => l.id === selectedLeadId ? {
      ...l, properties: [...l.properties, newProp],
    } : l));
    setPropertyForm({ title: '', location: '', value: 0, notes: '' });
    setShowAddProperty(false);
  };

  const removeProperty = (propId: string) => {
    if (!selectedLeadId) return;
    setLeads(prev => prev.map(l => l.id === selectedLeadId ? {
      ...l, properties: l.properties.filter(p => p.id !== propId),
    } : l));
  };

  // ── Task linked to lead ───────────────────────────
  const addLinkedTask = () => {
    if (!selectedLeadId || !taskForm.title.trim()) return;
    setTasks(prev => [...prev, {
      id: Date.now().toString(),
      title: taskForm.title.trim(),
      completed: false,
      date: taskForm.date,
      type: taskForm.type,
      leadId: selectedLeadId,
      createdAt: Date.now(),
    }]);
    setTaskForm({ title: '', type: 'follow_up', date: today });
    setShowAddTask(false);
  };

  // ── Contact actions ───────────────────────────────
  const openWhatsApp = (phone: string) => window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
  const openEmail = (email: string) => window.open(`mailto:${email}`, '_blank');
  const openPhone = (phone: string) => window.open(`tel:${phone.replace(/\D/g, '')}`, '_blank');

  // ── Status management ─────────────────────────────
  const handleAddStatus = () => {
    if (newStatusName && !statuses.includes(newStatusName)) {
      setStatuses(prev => [...prev, newStatusName]);
      setNewStatusName('');
    }
  };
  const handleEditStatus = (index: number) => { setEditingStatusIndex(index); setEditStatusText(statuses[index]); };
  const handleSaveStatusEdit = (index: number) => {
    if (editStatusText && editStatusText !== statuses[index]) {
      const oldName = statuses[index];
      setStatuses(prev => { const n = [...prev]; n[index] = editStatusText; return n; });
      setLeads(prev => prev.map(l => l.status === oldName ? { ...l, status: editStatusText } : l));
    }
    setEditingStatusIndex(null);
  };
  const requestDeleteStatus = (index: number) => {
    setConfirmModal({
      show: true, title: 'Excluir Status',
      message: 'Clientes com este status ficarão sem categoria. Deseja continuar?',
      action: () => { setStatuses(prev => prev.filter((_, i) => i !== index)); setConfirmModal(prev => ({ ...prev, show: false })); },
    });
  };

  // ── Lead form fields (shared add/edit) ────────────
  const LeadFormFields = () => (
    <div className="space-y-3 max-h-[60vh] overflow-y-auto">
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nome *</label>
        <input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-accent" autoFocus />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Telefone *</label>
          <input type="tel" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-accent" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Valor Potencial</label>
          <input type="number" value={formData.value || 0} onChange={e => setFormData({ ...formData, value: Number(e.target.value) })}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-accent" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Email</label>
          <input type="email" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-accent" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Aniversário</label>
          <input type="date" value={formData.birthday || ''} onChange={e => setFormData({ ...formData, birthday: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-accent" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Status</label>
        <div className="flex flex-wrap gap-2">
          {statuses.map(st => (
            <button key={st} type="button" onClick={() => setFormData({ ...formData, status: st })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${formData.status === st ? 'bg-primary text-white border-primary' : 'bg-white text-slate-500 border-slate-200'}`}>
              {st}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Notas</label>
        <textarea value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })}
          rows={2} placeholder="Observações sobre o cliente..."
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-accent resize-none" />
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════
  // ── DETAIL VIEW ─────────────────────────────────────
  // ════════════════════════════════════════════════════
  if (selectedLead) {
    const sortedInteractions = [...selectedLead.interactions].sort((a, b) => b.createdAt - a.createdAt);

    return (
      <div className="flex-1 overflow-y-auto no-scrollbar pb-28 md:pb-6">
        {/* Header */}
        <header className="bg-white px-5 pt-5 pb-4 border-b border-slate-100 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedLeadId(null)} className="p-2 -ml-2 hover:bg-slate-50 rounded-lg text-slate-500">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-slate-900 truncate">{selectedLead.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(selectedLead.status)}`}>{selectedLead.status}</span>
                <span className="text-xs text-slate-400">{formatCurrency(selectedLead.value)}</span>
              </div>
            </div>
            <button onClick={openEditLead} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400">
              <span className="material-symbols-outlined">edit</span>
            </button>
          </div>
        </header>

        <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto">
          {/* Info Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="material-symbols-outlined text-base text-slate-400">phone</span>
              {selectedLead.phone}
            </div>
            {selectedLead.email && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="material-symbols-outlined text-base text-slate-400">mail</span>
                {selectedLead.email}
              </div>
            )}
            {selectedLead.birthday && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="material-symbols-outlined text-base text-slate-400">cake</span>
                {formatDate(selectedLead.birthday)}
              </div>
            )}
            {selectedLead.notes && (
              <div className="flex items-start gap-2 text-sm text-slate-500 pt-1 border-t border-slate-50">
                <span className="material-symbols-outlined text-base text-slate-400 mt-0.5">notes</span>
                <span>{selectedLead.notes}</span>
              </div>
            )}
          </div>

          {/* Contact Actions */}
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => openWhatsApp(selectedLead.phone)}
              className="flex items-center justify-center gap-2 p-3 bg-emerald-50 text-emerald-700 rounded-xl font-medium text-sm hover:bg-emerald-100 transition-colors active:scale-95">
              <span className="material-symbols-outlined text-lg">chat</span> WhatsApp
            </button>
            {selectedLead.email && (
              <button onClick={() => openEmail(selectedLead.email!)}
                className="flex items-center justify-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-xl font-medium text-sm hover:bg-blue-100 transition-colors active:scale-95">
                <span className="material-symbols-outlined text-lg">mail</span> Email
              </button>
            )}
            <button onClick={() => openPhone(selectedLead.phone)}
              className="flex items-center justify-center gap-2 p-3 bg-violet-50 text-violet-700 rounded-xl font-medium text-sm hover:bg-violet-100 transition-colors active:scale-95">
              <span className="material-symbols-outlined text-lg">call</span> Ligar
            </button>
          </div>

          {/* Properties Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-accent text-lg">home</span>
                Propriedades de Interesse
              </h3>
              <button onClick={() => { setPropertyForm({ title: '', location: '', value: 0, notes: '' }); setShowAddProperty(true); }}
                className="text-accent text-xs font-medium flex items-center gap-1 hover:underline">
                <span className="material-symbols-outlined text-sm">add</span> Adicionar
              </button>
            </div>
            {selectedLead.properties.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-center text-sm text-slate-400">
                Nenhuma propriedade vinculada.
              </div>
            ) : (
              <div className="space-y-2">
                {selectedLead.properties.map(prop => (
                  <div key={prop.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 flex items-center gap-3 group">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-indigo-500 text-lg">apartment</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{prop.title}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        {prop.location && <span>{prop.location}</span>}
                        {prop.value && <><span className="w-1 h-1 bg-slate-300 rounded-full" /><span>{formatCurrency(prop.value)}</span></>}
                      </div>
                    </div>
                    <button onClick={() => removeProperty(prop.id)}
                      className="text-slate-300 hover:text-red-500 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interaction History */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-accent text-lg">history</span>
                Histórico de Interação
              </h3>
              <button onClick={() => { setInteractionForm({ type: 'ligacao', description: '', date: today }); setShowAddInteraction(true); }}
                className="text-accent text-xs font-medium flex items-center gap-1 hover:underline">
                <span className="material-symbols-outlined text-sm">add</span> Adicionar
              </button>
            </div>
            {sortedInteractions.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-center text-sm text-slate-400">
                Nenhuma interação registrada.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {sortedInteractions.map((inter, i) => (
                  <div key={inter.id} className={`p-3 flex gap-3 ${i > 0 ? 'border-t border-slate-50' : ''}`}>
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                        <span className="material-symbols-outlined text-slate-500 text-base">{INTERACTION_TYPE_ICONS[inter.type]}</span>
                      </div>
                      {i < sortedInteractions.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 mt-1" />}
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-slate-500">{formatDate(inter.date)}</span>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{INTERACTION_TYPE_LABELS[inter.type]}</span>
                        {inter.taskId && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-accent/10 text-accent">via Tarefa</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">{inter.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Linked Tasks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-accent text-lg">task_alt</span>
                Tarefas Vinculadas
              </h3>
              <button onClick={() => { setTaskForm({ title: '', type: 'follow_up', date: today }); setShowAddTask(true); }}
                className="text-accent text-xs font-medium flex items-center gap-1 hover:underline">
                <span className="material-symbols-outlined text-sm">add</span> Criar Tarefa
              </button>
            </div>
            {leadTasks.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-center text-sm text-slate-400">
                Nenhuma tarefa vinculada.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
                {leadTasks.map(task => (
                  <div key={task.id} className={`p-3 flex items-center gap-3 ${task.completed ? 'opacity-50' : ''}`}>
                    <div className={`w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center ${task.completed ? 'bg-accent border-accent' : 'border-slate-300'}`}>
                      {task.completed && <span className="material-symbols-outlined text-white text-sm">check</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-medium ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{task.title}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${TASK_TYPE_COLORS[task.type]}`}>
                          <span className="material-symbols-outlined text-[10px]">{TASK_TYPE_ICONS[task.type]}</span>
                          {TASK_TYPE_LABELS[task.type]}
                        </span>
                        <span className="text-[10px] text-slate-400">{formatDate(task.date)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Detail Modals ──────────────────────────── */}

        {/* Edit Lead Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowEditModal(false)}>
            <div className="bg-white w-full max-w-md rounded-t-3xl md:rounded-2xl p-6 shadow-2xl animate-[slideUp_0.3s_ease-out] md:animate-[fadeIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 md:hidden" />
              <h2 className="text-lg font-bold text-slate-900 mb-4">Editar Cliente</h2>
              <LeadFormFields />
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowEditModal(false)} className="flex-1 py-2.5 text-slate-500 font-medium hover:bg-slate-50 rounded-xl text-sm">Cancelar</button>
                <button onClick={() => saveLead(true)} disabled={!formData.name || !formData.phone}
                  className="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 text-sm disabled:opacity-50">Salvar</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Interaction Modal */}
        {showAddInteraction && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowAddInteraction(false)}>
            <div className="bg-white w-full max-w-md rounded-t-3xl md:rounded-2xl p-6 shadow-2xl animate-[slideUp_0.3s_ease-out] md:animate-[fadeIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 md:hidden" />
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-accent">add_comment</span> Nova Interação
              </h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Tipo</label>
                    <select value={interactionForm.type} onChange={e => setInteractionForm({ ...interactionForm, type: e.target.value as InteractionType })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-accent">
                      {(Object.keys(INTERACTION_TYPE_LABELS) as InteractionType[]).map(t => (
                        <option key={t} value={t}>{INTERACTION_TYPE_LABELS[t]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Data</label>
                    <input type="date" value={interactionForm.date} onChange={e => setInteractionForm({ ...interactionForm, date: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-accent" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Descrição *</label>
                  <textarea value={interactionForm.description} onChange={e => setInteractionForm({ ...interactionForm, description: e.target.value })}
                    rows={3} placeholder="O que aconteceu nessa interação..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-accent resize-none" autoFocus />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowAddInteraction(false)} className="flex-1 py-2.5 text-slate-500 font-medium hover:bg-slate-50 rounded-xl text-sm">Cancelar</button>
                <button onClick={addInteraction} disabled={!interactionForm.description.trim()}
                  className="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 text-sm disabled:opacity-50">Salvar</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Property Modal */}
        {showAddProperty && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowAddProperty(false)}>
            <div className="bg-white w-full max-w-md rounded-t-3xl md:rounded-2xl p-6 shadow-2xl animate-[slideUp_0.3s_ease-out] md:animate-[fadeIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 md:hidden" />
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-accent">apartment</span> Nova Propriedade
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Título *</label>
                  <input type="text" value={propertyForm.title || ''} onChange={e => setPropertyForm({ ...propertyForm, title: e.target.value })}
                    placeholder="Ex: Apto 3q Leblon" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-accent" autoFocus />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Localização</label>
                    <input type="text" value={propertyForm.location || ''} onChange={e => setPropertyForm({ ...propertyForm, location: e.target.value })}
                      placeholder="Bairro, Cidade" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-accent" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Valor</label>
                    <input type="number" value={propertyForm.value || 0} onChange={e => setPropertyForm({ ...propertyForm, value: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-accent" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowAddProperty(false)} className="flex-1 py-2.5 text-slate-500 font-medium hover:bg-slate-50 rounded-xl text-sm">Cancelar</button>
                <button onClick={addProperty} disabled={!propertyForm.title?.trim()}
                  className="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 text-sm disabled:opacity-50">Adicionar</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Linked Task Modal */}
        {showAddTask && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowAddTask(false)}>
            <div className="bg-white w-full max-w-md rounded-t-3xl md:rounded-2xl p-6 shadow-2xl animate-[slideUp_0.3s_ease-out] md:animate-[fadeIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 md:hidden" />
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-accent">add_task</span> Nova Tarefa para {selectedLead.name}
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Título *</label>
                  <input type="text" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                    placeholder="Ex: Follow-up proposta" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-accent" autoFocus />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Tipo</label>
                    <select value={taskForm.type} onChange={e => setTaskForm({ ...taskForm, type: e.target.value as TaskType })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-accent">
                      {(Object.keys(TASK_TYPE_LABELS) as TaskType[]).map(t => (
                        <option key={t} value={t}>{TASK_TYPE_LABELS[t]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Data</label>
                    <input type="date" value={taskForm.date} onChange={e => setTaskForm({ ...taskForm, date: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-accent" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowAddTask(false)} className="flex-1 py-2.5 text-slate-500 font-medium hover:bg-slate-50 rounded-xl text-sm">Cancelar</button>
                <button onClick={addLinkedTask} disabled={!taskForm.title.trim()}
                  className="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 text-sm disabled:opacity-50">Criar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════
  // ── LIST VIEW ───────────────────────────────────────
  // ════════════════════════════════════════════════════
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-28 md:pb-6">
      {/* Header */}
      <header className="bg-white px-5 pt-6 pb-4 border-b border-slate-100 sticky top-0 z-10">
        <div className="flex justify-between items-end md:hidden">
          <div>
            <h1 className="text-2xl font-bold text-primary tracking-tight">CRM</h1>
            <p className="text-sm text-slate-500">Gestão de clientes.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowStatusModal(true)} className="h-10 w-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <button onClick={openAddLead} className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 active:scale-95">
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>
        </div>
        <div className="hidden md:flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-primary tracking-tight">CRM</h1>
            <p className="text-slate-500 mt-1">Gestão completa de clientes.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowStatusModal(true)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">settings</span> Status
            </button>
            <button onClick={openAddLead} className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium shadow-lg shadow-primary/20 flex items-center gap-2 active:scale-95">
              <span className="material-symbols-outlined text-lg">add</span> Novo Lead
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4 relative">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400">search</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar nome ou telefone..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-accent" />
        </div>

        {/* Status Filters */}
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {['Todos', ...statuses].map(st => (
            <button key={st} onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border whitespace-nowrap transition-all ${
                filterStatus === st ? 'bg-primary text-white border-primary' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}>
              {st}
            </button>
          ))}
        </div>
      </header>

      {/* Leads List */}
      <div className="p-4 md:p-6 space-y-3 max-w-3xl mx-auto">
        {filteredLeads.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-20">group_off</span>
            <p className="text-sm">{search ? 'Nenhum resultado encontrado.' : 'Nenhum cliente cadastrado.'}</p>
          </div>
        ) : filteredLeads.map(lead => (
          <div key={lead.id} onClick={() => setSelectedLeadId(lead.id)}
            className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex items-center gap-3 group hover:border-accent/30 transition-all hover:shadow-md cursor-pointer">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-sm font-bold text-slate-500">
              {lead.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-bold text-slate-900 text-sm truncate">{lead.name}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${getStatusColor(lead.status)}`}>{lead.status}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-medium text-slate-700">{formatCurrency(lead.value)}</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                <span>{formatDate(lead.lastInteraction)}</span>
                {lead.interactions.length > 0 && (
                  <><span className="w-1 h-1 bg-slate-300 rounded-full" /><span>{lead.interactions.length} int.</span></>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={(e) => { e.stopPropagation(); openWhatsApp(lead.phone); }}
                className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 active:scale-95">
                <span className="material-symbols-outlined text-lg">chat</span>
              </button>
              {lead.email && (
                <button onClick={(e) => { e.stopPropagation(); openEmail(lead.email!); }}
                  className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 active:scale-95">
                  <span className="material-symbols-outlined text-lg">mail</span>
                </button>
              )}
              <button onClick={(e) => requestDeleteLead(lead.id, e)}
                className="w-9 h-9 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-red-50 hover:text-red-500">
                <span className="material-symbols-outlined text-lg">delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── List Modals ────────────────────────────── */}

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
          <div className="bg-white w-full max-w-md rounded-t-3xl md:rounded-2xl p-6 shadow-2xl animate-[slideUp_0.3s_ease-out] md:animate-[fadeIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 md:hidden" />
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-accent">person_add</span> Novo Cliente
            </h2>
            <LeadFormFields />
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 text-slate-500 font-medium hover:bg-slate-50 rounded-xl text-sm">Cancelar</button>
              <button onClick={() => saveLead(false)} disabled={!formData.name || !formData.phone}
                className="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 text-sm disabled:opacity-50">Criar Lead</button>
            </div>
          </div>
        </div>
      )}

      {/* Status Management Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowStatusModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-[fadeIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Gerenciar Status</h2>
            <div className="space-y-2 mb-4 max-h-[50vh] overflow-y-auto">
              {statuses.map((st, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                  {editingStatusIndex === index ? (
                    <div className="flex-1 flex gap-2">
                      <input type="text" value={editStatusText} onChange={e => setEditStatusText(e.target.value)}
                        className="flex-1 bg-white border border-slate-300 rounded text-xs px-2 py-1" autoFocus />
                      <button onClick={() => handleSaveStatusEdit(index)} className="text-emerald-600"><span className="material-symbols-outlined text-lg">check</span></button>
                      <button onClick={() => setEditingStatusIndex(null)} className="text-red-500"><span className="material-symbols-outlined text-lg">close</span></button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-medium text-slate-700">{st}</span>
                      <div className="flex gap-1">
                        <button onClick={() => handleEditStatus(index)} className="p-1.5 text-slate-400 hover:text-accent rounded-md"><span className="material-symbols-outlined text-lg">edit</span></button>
                        <button onClick={() => requestDeleteStatus(index)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-md"><span className="material-symbols-outlined text-lg">delete</span></button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-500 mb-2">Adicionar Novo Status</label>
              <div className="flex gap-2">
                <input type="text" value={newStatusName} onChange={e => setNewStatusName(e.target.value)}
                  placeholder="Ex: Em Negociação" className="flex-1 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-accent px-3 py-2" />
                <button onClick={handleAddStatus} disabled={!newStatusName}
                  className="bg-primary text-white px-4 rounded-lg shadow-lg shadow-primary/20 disabled:opacity-50">
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
            </div>
            <button onClick={() => setShowStatusModal(false)} className="w-full mt-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-medium">Fechar</button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-[fadeIn_0.2s_ease-out]">
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-2xl">warning</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">{confirmModal.title}</h3>
              <p className="text-sm text-slate-500">{confirmModal.message}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                className="flex-1 py-2.5 text-slate-500 font-medium hover:bg-slate-50 rounded-xl text-sm">Cancelar</button>
              <button onClick={confirmModal.action}
                className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl text-sm">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
