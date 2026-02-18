import React, { useState } from 'react';
import { Task } from '../types';

interface DashboardProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const Dashboard: React.FC<DashboardProps> = ({ tasks, setTasks }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  // States for Modals/Bottom Sheets
  const [showHistory, setShowHistory] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Computed
  const today = new Date().toISOString().split('T')[0];
  const dayTasks = tasks.filter(t => t.date === selectedDate);
  const completedCount = dayTasks.filter(t => t.completed).length;
  const progress = dayTasks.length > 0 ? (completedCount / dayTasks.length) * 100 : 0;

  // Helpers
  const formatDateDisplay = (dateStr: string) => {
    if (dateStr === today) return 'Hoje';
    
    const date = new Date(dateStr + 'T00:00:00'); // Fix Timezone issue by explicitly setting time or using split
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateStr === yesterday.toISOString().split('T')[0]) return 'Ontem';

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Amanhã';

    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
  };

  const changeDate = (days: number) => {
    const current = new Date(selectedDate + 'T00:00:00');
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  // Task Actions
  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    setTasks(prev => [...prev, {
      id: Date.now().toString(),
      title: newTaskTitle,
      completed: false,
      date: selectedDate
    }]);
    setNewTaskTitle('');
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const startEdit = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTask(task);
    setShowEditModal(true);
  };

  const saveEdit = () => {
    if (editingTask && editingTask.title.trim()) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? editingTask : t));
      setShowEditModal(false);
      setEditingTask(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-28 md:pb-6 relative">
      
      {/* Header Mobile */}
      <header className="bg-white px-6 pt-6 pb-4 border-b border-slate-100 sticky top-0 z-10 md:hidden">
        <div className="mb-2">
          <p className="text-slate-500 text-sm font-medium">Bom dia,</p>
          <h1 className="text-slate-900 text-2xl font-bold tracking-tight">Corretor James</h1>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden md:flex bg-white px-8 py-8 border-b border-slate-100 justify-between items-center">
         <div>
            <h1 className="text-3xl font-bold text-primary tracking-tight">Dashboard</h1>
            <p className="text-slate-500 mt-1">Visão geral da sua performance.</p>
         </div>
      </header>

      <div className="p-4 md:p-8 space-y-4 md:space-y-6 max-w-5xl mx-auto">
        
        {/* Motivational Quote */}
        <div className="bg-primary rounded-2xl p-4 md:p-6 text-white relative overflow-hidden shadow-float">
          <div className="absolute -right-4 -bottom-8 opacity-5">
            <span className="material-symbols-outlined text-[150px]">format_quote</span>
          </div>
          <div className="relative z-10">
            <p className="text-base md:text-xl font-medium leading-relaxed opacity-90 mb-3">
              "O sucesso não é o final, o fracasso não é fatal: é a coragem de continuar que conta."
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold uppercase tracking-widest">
              <span className="w-6 h-[2px] bg-accent"></span>
              Winston Churchill
            </div>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-3 gap-2 md:gap-6">
          <div className="bg-white p-3 md:p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center hover:border-accent/30 transition-colors">
            <p className="text-[10px] md:text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Comissão</p>
            <p className="text-base md:text-2xl font-bold text-slate-900">R$ 15k</p>
            <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium mt-1">+12%</span>
          </div>
          <div className="bg-white p-3 md:p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center hover:border-accent/30 transition-colors">
             <p className="text-[10px] md:text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Leads</p>
             <p className="text-base md:text-2xl font-bold text-slate-900">12</p>
             <span className="text-[10px] text-slate-500 mt-1 font-medium">Ativos</span>
          </div>
          <div className="bg-white p-3 md:p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center hover:border-accent/30 transition-colors">
             <p className="text-[10px] md:text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Visitas</p>
             <p className="text-base md:text-2xl font-bold text-accent">5</p>
             <span className="text-[10px] text-slate-500 mt-1 font-medium">Hoje</span>
          </div>
        </div>

        {/* Daily Checklist */}
        <div>
          {/* Date Navigator */}
          <div className="flex items-center justify-between mb-4 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
             <button onClick={() => changeDate(-1)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors">
                <span className="material-symbols-outlined">chevron_left</span>
             </button>
             
             <div onClick={() => setShowHistory(true)} className="flex flex-col items-center cursor-pointer group">
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-accent transition-colors flex items-center gap-1">
                  {formatDateDisplay(selectedDate)}
                  <span className="material-symbols-outlined text-sm text-slate-400">arrow_drop_down</span>
                </h3>
                {selectedDate === today && <span className="text-[10px] font-medium text-accent">Rotina de Hoje</span>}
             </div>
             
             <button onClick={() => changeDate(1)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors">
                <span className="material-symbols-outlined">chevron_right</span>
             </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[300px] flex flex-col">
             {/* Progress Bar */}
            <div className="h-1 w-full bg-slate-100">
              <div className="h-full bg-accent transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>
            
            {/* Add Task Input */}
            <form onSubmit={addTask} className="p-3 border-b border-slate-50 flex gap-2">
               <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder={`+ Tarefa para ${formatDateDisplay(selectedDate)}...`}
                  className="flex-1 min-w-0 bg-slate-50 border-none rounded-lg text-sm focus:ring-1 focus:ring-accent px-3 py-2"
               />
               <button
                  type="submit"
                  disabled={!newTaskTitle.trim()}
                  className="bg-primary text-white px-3 py-2 rounded-lg text-xs font-medium disabled:opacity-50 shrink-0"
               >
                 Adicionar
               </button>
            </form>

            <div className="divide-y divide-slate-50 flex-1">
              {dayTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-sm">
                  <span className="material-symbols-outlined text-4xl mb-2 opacity-20">event_available</span>
                  <p>Nenhuma tarefa para este dia.</p>
                </div>
              ) : dayTasks.map(task => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors group ${task.completed ? 'opacity-50' : ''}`}
                >
                  <div className={`w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center transition-all ${
                    task.completed ? 'bg-accent border-accent' : 'border-slate-300'
                  }`}>
                    {task.completed && <span className="material-symbols-outlined text-white text-sm">check</span>}
                  </div>

                  <span className={`flex-1 min-w-0 text-sm font-medium break-words ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                    {task.title}
                  </span>

                  {/* Actions */}
                  <div className="flex shrink-0 gap-0 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => startEdit(task, e)}
                      className="text-slate-300 hover:text-accent hover:bg-slate-100 p-1.5 rounded-full transition-all"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                      className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-all"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* History / Calendar Bottom Sheet */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowHistory(false)}>
           <div 
             className="bg-white w-full max-w-md rounded-t-3xl p-6 shadow-2xl animate-[slideUp_0.3s_ease-out] flex flex-col max-h-[80vh]"
             onClick={e => e.stopPropagation()}
           >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
              
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-accent">calendar_month</span> 
                Histórico
              </h2>

              <div className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Selecionar Data</label>
                    <input 
                      type="date" 
                      value={selectedDate}
                      onChange={(e) => { setSelectedDate(e.target.value); setShowHistory(false); }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:ring-accent focus:border-accent"
                    />
                 </div>

                 <div className="pt-2">
                   <p className="text-xs font-bold text-slate-500 mb-2 uppercase">Atalhos</p>
                   <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => { setSelectedDate(today); setShowHistory(false); }}
                        className="p-3 rounded-xl bg-slate-50 hover:bg-accent/10 hover:text-accent transition-colors text-sm font-medium text-slate-600 border border-slate-100"
                      >
                        Ir para Hoje
                      </button>
                      <button 
                        onClick={() => { 
                           const d = new Date(); d.setDate(d.getDate() - 1); 
                           setSelectedDate(d.toISOString().split('T')[0]); 
                           setShowHistory(false); 
                        }}
                        className="p-3 rounded-xl bg-slate-50 hover:bg-accent/10 hover:text-accent transition-colors text-sm font-medium text-slate-600 border border-slate-100"
                      >
                        Ir para Ontem
                      </button>
                   </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditModal && editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
           <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-[fadeIn_0.2s_ease-out]">
              <h3 className="font-bold text-lg text-slate-900 mb-4">Editar Tarefa</h3>
              
              <input 
                type="text" 
                value={editingTask.title}
                onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                className="w-full bg-slate-50 border-slate-200 rounded-lg mb-4 text-sm focus:ring-accent focus:border-accent"
                autoFocus
              />
              
              <div className="flex gap-3">
                 <button 
                   onClick={() => setShowEditModal(false)}
                   className="flex-1 py-2 text-slate-500 font-medium hover:bg-slate-50 rounded-lg text-sm"
                 >
                   Cancelar
                 </button>
                 <button 
                   onClick={saveEdit}
                   className="flex-1 py-2 bg-primary text-white font-bold rounded-lg shadow-lg shadow-primary/20 text-sm"
                 >
                   Salvar
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;