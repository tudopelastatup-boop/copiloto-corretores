import React, { useState, useMemo } from 'react';
import { Task, Lead, TaskType, TASK_TYPE_LABELS, TASK_TYPE_ICONS, TASK_TYPE_COLORS } from '../types';

interface RotinaProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  leads: Lead[];
}

type ViewMode = 'list' | 'calendar';

const Rotina: React.FC<RotinaProps> = ({ tasks, setTasks, leads }) => {
  const today = new Date().toISOString().split('T')[0];

  // ── State ─────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState(today);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  // Task creation
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState<TaskType>('geral');
  const [newLeadId, setNewLeadId] = useState('');
  const [newDate, setNewDate] = useState(today);

  // Task editing
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  // ── Computed ──────────────────────────────────────
  const dayTasks = useMemo(() => tasks.filter(t => t.date === selectedDate), [tasks, selectedDate]);
  const pendingTasks = dayTasks.filter(t => !t.completed);
  const completedTasks = dayTasks.filter(t => t.completed);
  const completedCount = completedTasks.length;
  const totalCount = dayTasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // ── Helpers ───────────────────────────────────────
  const formatDateDisplay = (dateStr: string) => {
    if (dateStr === today) return 'Hoje';
    const date = new Date(dateStr + 'T00:00:00');
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    if (dateStr === yesterday.toISOString().split('T')[0]) return 'Ontem';
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Amanhã';
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
  };

  const formatDateFull = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const changeDate = (days: number) => {
    const current = new Date(selectedDate + 'T00:00:00');
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const getLeadName = (leadId?: string) => {
    if (!leadId) return null;
    const lead = leads.find(l => l.id === leadId);
    return lead ? lead.name : null;
  };

  // ── Task Actions ──────────────────────────────────
  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const openAddModal = () => {
    setNewTitle('');
    setNewDescription('');
    setNewType('geral');
    setNewLeadId('');
    setNewDate(selectedDate);
    setShowAddModal(true);
  };

  const addTask = () => {
    if (!newTitle.trim()) return;
    setTasks(prev => [...prev, {
      id: Date.now().toString(),
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      completed: false,
      date: newDate,
      type: newType,
      leadId: newLeadId || undefined,
      createdAt: Date.now(),
    }]);
    setShowAddModal(false);
  };

  const openEditModal = (task: Task) => {
    setEditingTask({ ...task });
    setShowEditModal(true);
  };

  const saveEdit = () => {
    if (!editingTask || !editingTask.title.trim()) return;
    setTasks(prev => prev.map(t => t.id === editingTask.id ? editingTask : t));
    setShowEditModal(false);
    setEditingTask(null);
  };

  const confirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingTaskId(id);
    setShowDeleteConfirm(true);
  };

  const deleteTask = () => {
    if (deletingTaskId) {
      setTasks(prev => prev.filter(t => t.id !== deletingTaskId));
    }
    setShowDeleteConfirm(false);
    setDeletingTaskId(null);
  };

  // ── Calendar Logic ────────────────────────────────
  const calendarDays = useMemo(() => {
    const { year, month } = calendarMonth;
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: { date: string; day: number; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ date: dateStr, day: d, isCurrentMonth: false });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ date: dateStr, day: d, isCurrentMonth: true });
    }

    // Next month padding to complete grid
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        const nextMonth = month === 11 ? 0 : month + 1;
        const nextYear = month === 11 ? year + 1 : year;
        const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        days.push({ date: dateStr, day: d, isCurrentMonth: false });
      }
    }

    return days;
  }, [calendarMonth]);

  const getTaskStatusForDate = (dateStr: string): 'none' | 'all' | 'partial' | 'pending' => {
    const dayTasks = tasks.filter(t => t.date === dateStr);
    if (dayTasks.length === 0) return 'none';
    const allDone = dayTasks.every(t => t.completed);
    const noneDone = dayTasks.every(t => !t.completed);
    if (allDone) return 'all';
    if (noneDone) return 'pending';
    return 'partial';
  };

  const getTaskCountForDate = (dateStr: string) => tasks.filter(t => t.date === dateStr).length;

  const changeCalendarMonth = (delta: number) => {
    setCalendarMonth(prev => {
      let m = prev.month + delta;
      let y = prev.year;
      if (m > 11) { m = 0; y++; }
      if (m < 0) { m = 11; y--; }
      return { year: y, month: m };
    });
  };

  const monthLabel = new Date(calendarMonth.year, calendarMonth.month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const dotColorMap = { none: '', all: 'bg-emerald-500', partial: 'bg-amber-400', pending: 'bg-red-400' };

  // ── Task Item Component ───────────────────────────
  const TaskItem: React.FC<{ task: Task }> = ({ task }) => {
    const leadName = getLeadName(task.leadId);
    return (
      <div
        onClick={() => toggleTask(task.id)}
        className={`p-3 flex items-start gap-3 cursor-pointer hover:bg-slate-50 transition-colors group ${task.completed ? 'opacity-50' : ''}`}
      >
        <div className={`w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center mt-0.5 transition-all ${
          task.completed ? 'bg-accent border-accent' : 'border-slate-300'
        }`}>
          {task.completed && <span className="material-symbols-outlined text-white text-sm">check</span>}
        </div>

        <div className="flex-1 min-w-0">
          <span className={`text-sm font-medium break-words block ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
            {task.title}
          </span>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${TASK_TYPE_COLORS[task.type]}`}>
              <span className="material-symbols-outlined text-xs">{TASK_TYPE_ICONS[task.type]}</span>
              {TASK_TYPE_LABELS[task.type]}
            </span>
            {leadName && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-600">
                <span className="material-symbols-outlined text-xs">person</span>
                {leadName}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 gap-0 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); openEditModal(task); }}
            className="text-slate-300 hover:text-accent hover:bg-slate-100 p-1.5 rounded-full transition-all"
          >
            <span className="material-symbols-outlined text-base">edit</span>
          </button>
          <button
            onClick={(e) => confirmDelete(task.id, e)}
            className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-all"
          >
            <span className="material-symbols-outlined text-base">delete</span>
          </button>
        </div>
      </div>
    );
  };

  // ── Form Fields (shared between add/edit) ─────────
  const TaskFormFields = ({
    title, setTitle, description, setDescription, type, setType, leadId, setLeadId, date, setDate,
  }: {
    title: string; setTitle: (v: string) => void;
    description: string; setDescription: (v: string) => void;
    type: TaskType; setType: (v: TaskType) => void;
    leadId: string; setLeadId: (v: string) => void;
    date: string; setDate: (v: string) => void;
  }) => (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nome *</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Ex: Ligar para Roberto"
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-accent focus:border-accent"
          autoFocus
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Descrição</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Detalhes opcionais..."
          rows={2}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-accent focus:border-accent resize-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Data</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-accent focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Tipo</label>
          <select
            value={type}
            onChange={e => setType(e.target.value as TaskType)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-accent focus:border-accent"
          >
            {(Object.keys(TASK_TYPE_LABELS) as TaskType[]).map(t => (
              <option key={t} value={t}>{TASK_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Lead Vinculado</label>
        <select
          value={leadId}
          onChange={e => setLeadId(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-accent focus:border-accent"
        >
          <option value="">Nenhum</option>
          {leads.map(l => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-28 md:pb-6 relative">

      {/* ── Header Mobile ─────────────────────────── */}
      <header className="bg-white px-6 pt-6 pb-4 border-b border-slate-100 sticky top-0 z-10 md:hidden">
        <h1 className="text-slate-900 text-2xl font-bold tracking-tight">Rotina</h1>
        <p className="text-slate-500 text-sm">Organize seu dia.</p>
      </header>

      {/* ── Header Desktop ────────────────────────── */}
      <header className="hidden md:flex bg-white px-8 py-8 border-b border-slate-100 justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Rotina</h1>
          <p className="text-slate-500 mt-1">Organize seu dia com produtividade.</p>
        </div>
      </header>

      <div className="p-4 md:p-8 space-y-4 md:space-y-6 max-w-5xl mx-auto">

        {/* ── View Toggle ─────────────────────────── */}
        <div className="flex bg-white rounded-xl border border-slate-100 shadow-sm p-1 max-w-xs">
          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'list' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-lg">view_list</span>
            Lista
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'calendar' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-lg">calendar_month</span>
            Calendário
          </button>
        </div>

        {/* ══════════════════════════════════════════ */}
        {/* ── LIST VIEW ──────────────────────────── */}
        {/* ══════════════════════════════════════════ */}
        {viewMode === 'list' && (
          <>
            {/* Date Navigator */}
            <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
              <button onClick={() => changeDate(-1)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <div className="flex flex-col items-center">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1">
                  {formatDateDisplay(selectedDate)}
                </h3>
                <span className="text-[10px] text-slate-400 font-medium">{formatDateFull(selectedDate)}</span>
              </div>
              <button onClick={() => changeDate(1)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>

            {/* Progress Bar */}
            {totalCount > 0 && (
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500 font-medium">Progresso do dia</span>
                  <span className="text-xs font-bold text-slate-700">{completedCount}/{totalCount} ({Math.round(progress)}%)</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {/* Add Task Button */}
            <button
              onClick={openAddModal}
              className="w-full flex items-center justify-center gap-2 p-3 bg-white rounded-xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-accent hover:text-accent transition-colors text-sm font-medium"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Nova tarefa para {formatDateDisplay(selectedDate)}
            </button>

            {/* Task List */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {dayTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-sm">
                  <span className="material-symbols-outlined text-4xl mb-2 opacity-20">event_available</span>
                  <p>Nenhuma tarefa para este dia.</p>
                  <button onClick={openAddModal} className="mt-2 text-accent text-xs font-medium hover:underline">
                    Adicionar tarefa
                  </button>
                </div>
              ) : (
                <>
                  {/* Pending Tasks */}
                  {pendingTasks.length > 0 && (
                    <div className="divide-y divide-slate-50">
                      {pendingTasks.map(task => <TaskItem key={task.id} task={task} />)}
                    </div>
                  )}

                  {/* Completed separator */}
                  {completedTasks.length > 0 && pendingTasks.length > 0 && (
                    <div className="px-4 py-2 bg-slate-50 border-y border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Concluídas ({completedTasks.length})
                      </span>
                    </div>
                  )}

                  {/* Completed Tasks */}
                  {completedTasks.length > 0 && (
                    <div className="divide-y divide-slate-50">
                      {completedTasks.map(task => <TaskItem key={task.id} task={task} />)}
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════ */}
        {/* ── CALENDAR VIEW ──────────────────────── */}
        {/* ══════════════════════════════════════════ */}
        {viewMode === 'calendar' && (
          <>
            {/* Month Navigator */}
            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
              <button onClick={() => changeCalendarMonth(-1)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <h3 className="text-sm font-bold text-slate-900 capitalize">{monthLabel}</h3>
              <button onClick={() => changeCalendarMonth(1)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 md:p-4">
              {/* Day labels */}
              <div className="grid grid-cols-7 mb-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                  <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase py-1">{d}</div>
                ))}
              </div>
              {/* Days */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, i) => {
                  const status = getTaskStatusForDate(day.date);
                  const count = getTaskCountForDate(day.date);
                  const isSelected = day.date === selectedDate;
                  const isToday = day.date === today;
                  return (
                    <button
                      key={i}
                      onClick={() => { setSelectedDate(day.date); setViewMode('list'); }}
                      className={`relative flex flex-col items-center justify-center py-2 rounded-lg text-sm transition-all ${
                        !day.isCurrentMonth ? 'text-slate-300' :
                        isSelected ? 'bg-accent text-white font-bold shadow-sm' :
                        isToday ? 'bg-accent/10 text-accent font-bold' :
                        'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{day.day}</span>
                      {status !== 'none' && day.isCurrentMonth && (
                        <div className="flex items-center gap-0.5 mt-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : dotColorMap[status]}`} />
                          {count > 1 && (
                            <span className={`text-[8px] font-bold ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>{count}</span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected day tasks preview */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-accent text-lg">event_note</span>
                {formatDateDisplay(selectedDate)} — {formatDateFull(selectedDate)}
              </h3>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {dayTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-24 text-slate-400 text-sm">
                    <p>Sem tarefas neste dia.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {dayTasks.map(task => <TaskItem key={task.id} task={task} />)}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/* ── MODALS ──────────────────────────────────── */}
      {/* ══════════════════════════════════════════════ */}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
          <div
            className="bg-white w-full max-w-md rounded-t-3xl md:rounded-2xl p-6 shadow-2xl animate-[slideUp_0.3s_ease-out] md:animate-[fadeIn_0.2s_ease-out]"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 md:hidden" />
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-accent">add_task</span>
              Nova Tarefa
            </h2>

            <TaskFormFields
              title={newTitle} setTitle={setNewTitle}
              description={newDescription} setDescription={setNewDescription}
              type={newType} setType={setNewType}
              leadId={newLeadId} setLeadId={setNewLeadId}
              date={newDate} setDate={setNewDate}
            />

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 text-slate-500 font-medium hover:bg-slate-50 rounded-xl text-sm">
                Cancelar
              </button>
              <button
                onClick={addTask}
                disabled={!newTitle.trim()}
                className="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 text-sm disabled:opacity-50"
              >
                Criar Tarefa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditModal && editingTask && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowEditModal(false)}>
          <div
            className="bg-white w-full max-w-md rounded-t-3xl md:rounded-2xl p-6 shadow-2xl animate-[slideUp_0.3s_ease-out] md:animate-[fadeIn_0.2s_ease-out]"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 md:hidden" />
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-accent">edit</span>
              Editar Tarefa
            </h2>

            <TaskFormFields
              title={editingTask.title} setTitle={v => setEditingTask({ ...editingTask, title: v })}
              description={editingTask.description || ''} setDescription={v => setEditingTask({ ...editingTask, description: v || undefined })}
              type={editingTask.type} setType={v => setEditingTask({ ...editingTask, type: v })}
              leadId={editingTask.leadId || ''} setLeadId={v => setEditingTask({ ...editingTask, leadId: v || undefined })}
              date={editingTask.date} setDate={v => setEditingTask({ ...editingTask, date: v })}
            />

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowEditModal(false)} className="flex-1 py-2.5 text-slate-500 font-medium hover:bg-slate-50 rounded-xl text-sm">
                Cancelar
              </button>
              <button
                onClick={saveEdit}
                disabled={!editingTask.title.trim()}
                className="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 text-sm disabled:opacity-50"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl animate-[fadeIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-red-500 text-2xl">delete</span>
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-1">Excluir tarefa?</h3>
              <p className="text-sm text-slate-500 mb-4">Essa ação não pode ser desfeita.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 text-slate-500 font-medium hover:bg-slate-50 rounded-xl text-sm">
                Cancelar
              </button>
              <button onClick={deleteTask} className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl text-sm">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Rotina;
