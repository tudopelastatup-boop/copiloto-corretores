import React, { useState } from 'react';
import { Goal } from '../types';

interface GoalsProps {
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
}

const Goals: React.FC<GoalsProps> = ({ goals, setGoals }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<string | null>(null); // ID of goal being edited
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    title: '',
    currentValue: 0,
    targetValue: 0,
    type: 'currency'
  });

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({ show: false, title: '', message: '', action: () => {} });

  const handleSave = () => {
    if (!newGoal.title || !newGoal.targetValue) return;

    if (editingGoal) {
      setGoals(prev => prev.map(g => g.id === editingGoal ? { ...g, ...newGoal } as Goal : g));
    } else {
      setGoals(prev => [...prev, { ...newGoal, id: Date.now().toString() } as Goal]);
    }
    
    closeModal();
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingGoal(null);
    setNewGoal({ title: '', currentValue: 0, targetValue: 0, type: 'currency' });
  };

  const openUpdateModal = (goal: Goal) => {
    setNewGoal(goal);
    setEditingGoal(goal.id);
    setShowModal(true);
  };

  const requestDeleteGoal = (id: string) => {
    setConfirmModal({
      show: true,
      title: 'Excluir Meta',
      message: 'Tem certeza que deseja excluir esta meta? Todo o progresso registrado será perdido permanentemente.',
      action: () => {
        setGoals(prev => prev.filter(g => g.id !== id));
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  const formatValue = (value: number, type: 'currency' | 'number') => {
    if (type === 'currency') {
      return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    return value.toString();
  };

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-28 md:pb-6 bg-slate-50/50">
      <header className="bg-white/80 backdrop-blur-md px-5 pt-6 pb-4 border-b border-slate-200 sticky top-0 z-10">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-primary tracking-tight">Metas</h1>
            <p className="text-sm text-slate-500">Acompanhamento manual.</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="h-10 px-4 rounded-lg bg-primary text-white flex items-center gap-2 text-sm font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform hover:bg-slate-800"
          >
             <span className="material-symbols-outlined text-sm">add</span> Nova Meta
          </button>
        </div>
      </header>

      <div className="p-4 md:p-5 space-y-3 md:space-y-4">
        {goals.map(goal => {
          const percent = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));

          return (
            <div key={goal.id} className="bg-white rounded-2xl p-4 md:p-6 shadow-soft border border-slate-100 group">
              <div className="flex justify-between items-start mb-3">
                <div className="min-w-0 flex-1">
                   <h3 className="font-bold text-slate-900 text-base md:text-lg truncate">{goal.title}</h3>
                   <span className="text-[10px] md:text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wide">{goal.type === 'currency' ? 'Financeira' : 'Numérica'}</span>
                </div>
                <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                    <button onClick={() => openUpdateModal(goal)} className="p-1.5 text-slate-400 hover:text-accent hover:bg-slate-50 rounded-lg">
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button onClick={() => requestDeleteGoal(goal.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                </div>
              </div>

              <div className="flex items-end justify-between mb-2">
                 <span className="text-xl md:text-2xl font-bold text-accent">
                   {formatValue(goal.currentValue, goal.type)}
                 </span>
                 <span className="text-xs md:text-sm font-medium text-slate-400 mb-0.5">
                   de {formatValue(goal.targetValue, goal.type)}
                 </span>
              </div>

              <div className="w-full bg-slate-100 h-2.5 md:h-3 rounded-full overflow-hidden mb-1.5 relative">
                 <div
                   className="h-full rounded-full transition-all duration-1000 relative overflow-hidden bg-accent"
                   style={{ width: `${percent}%` }}
                 >
                   <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                 </div>
              </div>
              <p className="text-right text-[10px] md:text-xs font-bold text-slate-500">{percent}% Concluído</p>

              <button
                 onClick={() => openUpdateModal(goal)}
                 className="w-full mt-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-accent hover:border-accent/30 transition-colors"
              >
                Atualizar Progresso
              </button>
            </div>
          );
        })}
        
        {goals.length === 0 && (
           <div className="text-center py-20 text-slate-400">
              <span className="material-symbols-outlined text-5xl mb-2 opacity-50">flag</span>
              <p>Nenhuma meta definida.</p>
           </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
           <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-[fadeIn_0.2s_ease-out]">
              <h2 className="text-xl font-bold text-slate-900 mb-4">{editingGoal ? 'Atualizar Meta' : 'Criar Nova Meta'}</h2>
              
              <div className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Título</label>
                    <input 
                      type="text" 
                      value={newGoal.title} 
                      onChange={e => setNewGoal({...newGoal, title: e.target.value})}
                      className="w-full bg-slate-50 border-slate-200 rounded-lg text-sm focus:ring-accent focus:border-accent"
                      placeholder="Ex: Vendas do Mês"
                    />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Tipo</label>
                        <select 
                          value={newGoal.type}
                          onChange={e => setNewGoal({...newGoal, type: e.target.value as any})}
                          className="w-full bg-slate-50 border-slate-200 rounded-lg text-sm focus:ring-accent focus:border-accent"
                        >
                           <option value="currency">Dinheiro (R$)</option>
                           <option value="number">Numérico</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Meta (Alvo)</label>
                        <input 
                          type="number" 
                          value={newGoal.targetValue || ''} 
                          onChange={e => setNewGoal({...newGoal, targetValue: Number(e.target.value)})}
                          className="w-full bg-slate-50 border-slate-200 rounded-lg text-sm focus:ring-accent focus:border-accent"
                        />
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Valor Atual</label>
                    <input 
                      type="number" 
                      value={newGoal.currentValue || ''} 
                      onChange={e => setNewGoal({...newGoal, currentValue: Number(e.target.value)})}
                      className="w-full bg-slate-50 border-slate-200 rounded-lg text-sm focus:ring-accent focus:border-accent"
                    />
                 </div>
              </div>

              <div className="flex gap-3 mt-6">
                 <button onClick={closeModal} className="flex-1 py-3 text-slate-500 font-medium hover:bg-slate-50 rounded-xl">Cancelar</button>
                 <button onClick={handleSave} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20">Salvar</button>
              </div>
           </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
           <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-[fadeIn_0.2s_ease-out]">
              <div className="flex flex-col items-center text-center mb-6">
                 <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-2xl">warning</span>
                 </div>
                 <h3 className="text-lg font-bold text-slate-900 mb-2">{confirmModal.title}</h3>
                 <p className="text-sm text-slate-500 leading-relaxed">{confirmModal.message}</p>
              </div>
              
              <div className="flex gap-3">
                 <button 
                   onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                   className="flex-1 py-3 text-slate-500 font-medium hover:bg-slate-50 rounded-xl transition-colors border border-transparent"
                 >
                   Cancelar
                 </button>
                 <button 
                   onClick={confirmModal.action}
                   className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 hover:bg-red-600 transition-colors"
                 >
                   Excluir
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default Goals;