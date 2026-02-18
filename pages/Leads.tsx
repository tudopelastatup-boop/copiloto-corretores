import React, { useState } from 'react';
import { Lead } from '../types';

interface LeadsProps {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  statuses: string[];
  setStatuses: React.Dispatch<React.SetStateAction<string[]>>;
}

const Leads: React.FC<LeadsProps> = ({ leads, setLeads, statuses, setStatuses }) => {
  const [showModal, setShowModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [editingLead, setEditingLead] = useState<string | null>(null);
  
  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({ show: false, title: '', message: '', action: () => {} });

  // Lead Form State
  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState<Partial<Lead>>({
    name: '', status: statuses[0], value: 0, phone: '', email: '', lastInteraction: today
  });

  // Status Management State
  const [newStatusName, setNewStatusName] = useState('');
  const [editingStatusIndex, setEditingStatusIndex] = useState<number | null>(null);
  const [editStatusText, setEditStatusText] = useState('');

  // --- Lead Actions ---

  const handleSaveLead = () => {
    if (!formData.name || !formData.phone) return;

    if (editingLead) {
      setLeads(prev => prev.map(l => l.id === editingLead ? { ...l, ...formData } as Lead : l));
    } else {
      setLeads(prev => [...prev, { ...formData, id: Date.now().toString() } as Lead]);
    }
    closeModal();
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingLead(null);
    setFormData({ name: '', status: statuses[0], value: 0, phone: '', email: '', lastInteraction: today });
  };

  const openEdit = (lead: Lead) => {
    setFormData(lead);
    setEditingLead(lead.id);
    setShowModal(true);
  };

  const requestDeleteLead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({
      show: true,
      title: 'Excluir Cliente',
      message: 'Tem certeza que deseja remover este cliente permanentemente? Esta ação não pode ser desfeita.',
      action: () => {
        setLeads(prev => prev.filter(l => l.id !== id));
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  // --- Status Actions ---

  const handleAddStatus = () => {
    if(newStatusName && !statuses.includes(newStatusName)) {
      setStatuses(prev => [...prev, newStatusName]);
      setNewStatusName('');
    }
  };

  const handleEditStatus = (index: number) => {
    setEditingStatusIndex(index);
    setEditStatusText(statuses[index]);
  };

  const handleSaveStatusEdit = (index: number) => {
    if (editStatusText && editStatusText !== statuses[index]) {
      const oldName = statuses[index];
      const newName = editStatusText;

      // Update the status list
      setStatuses(prev => {
        const next = [...prev];
        next[index] = newName;
        return next;
      });

      // Update leads that had the old status
      setLeads(prev => prev.map(l => l.status === oldName ? { ...l, status: newName } : l));
    }
    setEditingStatusIndex(null);
    setEditStatusText('');
  };

  const requestDeleteStatus = (index: number) => {
    setConfirmModal({
      show: true,
      title: 'Excluir Status',
      message: 'Atenção: Clientes com este status não serão excluídos, mas ficarão sem categoria válida. Deseja continuar?',
      action: () => {
        setStatuses(prev => prev.filter((_, i) => i !== index));
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  // --- Helpers ---

  const getStatusColor = (status: string) => {
    if (status.toLowerCase().includes('quen')) return 'bg-red-50 text-red-600 border-red-100';
    if (status.toLowerCase().includes('morn')) return 'bg-amber-50 text-amber-600 border-amber-100';
    if (status.toLowerCase().includes('fech')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (status.toLowerCase().includes('frio')) return 'bg-slate-100 text-slate-500 border-slate-200';
    return 'bg-indigo-50 text-indigo-600 border-indigo-100'; // Default for custom
  };

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const formatDateDisplay = (dateString?: string) => {
    if (!dateString) return '-';
    // Fix Timezone offset for display
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-28 md:pb-6 bg-slate-50/50">
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md px-5 pt-6 pb-4 border-b border-slate-200 sticky top-0 z-10">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-primary tracking-tight">Leads</h1>
            <p className="text-sm text-slate-500">Gestão completa da carteira.</p>
          </div>
          <div className="flex gap-2">
             <button onClick={() => setShowStatusModal(true)} className="h-10 w-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200">
                <span className="material-symbols-outlined">settings</span>
             </button>
             <button onClick={() => setShowModal(true)} className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 active:scale-95 transition-transform hover:bg-slate-800">
                <span className="material-symbols-outlined">add</span>
             </button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="mt-4 relative group">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 group-focus-within:text-accent transition-colors">search</span>
          <input 
            type="text" 
            placeholder="Buscar nome ou telefone..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-accent/50 text-slate-800 placeholder-slate-400 transition-all"
          />
        </div>
      </header>

      {/* Leads List */}
      <div className="p-5 space-y-3">
        {leads.length === 0 ? (
           <div className="text-center py-10 text-slate-400">Nenhum cliente cadastrado.</div>
        ) : leads.map((lead) => (
          <div key={lead.id} onClick={() => openEdit(lead)} className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex items-center gap-3 group hover:border-accent/30 transition-all hover:shadow-md cursor-pointer relative overflow-hidden">
            <div className="flex-1 min-w-0 relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-slate-900 text-sm truncate">{lead.name}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${getStatusColor(lead.status)}`}>
                  {lead.status}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-medium text-slate-700">
                   {lead.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                <span className="w-1 h-1 bg-slate-300 rounded-full shrink-0"></span>
                <span className="truncate">{formatDateDisplay(lead.lastInteraction)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 relative z-10">
              <button
                onClick={(e) => { e.stopPropagation(); handleWhatsApp(lead.phone); }}
                className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors active:scale-95"
              >
                <span className="material-symbols-outlined text-lg">chat</span>
              </button>
              <button
                 onClick={(e) => requestDeleteLead(lead.id, e)}
                 className="w-9 h-9 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
              </button>
            </div>
          </div>
        ))}
        
        <div className="pt-4 text-center">
            <p className="text-xs text-slate-400 font-medium">Fim da lista</p>
        </div>
      </div>

      {/* Add/Edit Lead Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/40 backdrop-blur-sm">
           <div className="bg-white rounded-t-3xl md:rounded-2xl p-6 w-full max-w-md shadow-2xl animate-[slideUp_0.3s_ease-out] md:animate-[fadeIn_0.2s_ease-out]">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold text-slate-900">{editingLead ? 'Editar Cliente' : 'Novo Cliente'}</h2>
                 <button onClick={closeModal} className="p-2 bg-slate-100 rounded-full text-slate-500"><span className="material-symbols-outlined">close</span></button>
              </div>
              
              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Nome Completo</label>
                    <input 
                      type="text" 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-slate-50 border-slate-200 rounded-lg text-sm focus:ring-accent focus:border-accent"
                    />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Telefone (Whatsapp)</label>
                        <input 
                          type="tel" 
                          value={formData.phone} 
                          onChange={e => setFormData({...formData, phone: e.target.value})}
                          className="w-full bg-slate-50 border-slate-200 rounded-lg text-sm focus:ring-accent focus:border-accent"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Valor Potencial</label>
                        <input 
                          type="number" 
                          value={formData.value} 
                          onChange={e => setFormData({...formData, value: Number(e.target.value)})}
                          className="w-full bg-slate-50 border-slate-200 rounded-lg text-sm focus:ring-accent focus:border-accent"
                        />
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Status</label>
                    <div className="grid grid-cols-3 gap-2">
                       {statuses.map(st => (
                          <button
                             key={st}
                             type="button"
                             onClick={() => setFormData({...formData, status: st})}
                             className={`px-2 py-2 rounded-lg text-xs font-bold border transition-all ${
                               formData.status === st 
                               ? 'bg-primary text-white border-primary' 
                               : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                             }`}
                          >
                             {st}
                          </button>
                       ))}
                    </div>
                 </div>

                 <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">Data da Última Interação</label>
                     <input 
                       type="date" 
                       value={formData.lastInteraction}
                       onChange={e => setFormData({...formData, lastInteraction: e.target.value})} 
                       className="w-full bg-slate-50 border-slate-200 rounded-lg text-sm focus:ring-accent focus:border-accent"
                     />
                 </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                 <button onClick={handleSaveLead} className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20">
                    Salvar Cliente
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Status Management Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
           <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-[fadeIn_0.2s_ease-out]">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Gerenciar Status</h2>
              
              <div className="space-y-2 mb-4 max-h-[50vh] overflow-y-auto">
                 {statuses.map((st, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                       {editingStatusIndex === index ? (
                         <div className="flex-1 flex gap-2">
                            <input 
                              type="text" 
                              value={editStatusText} 
                              onChange={e => setEditStatusText(e.target.value)}
                              className="flex-1 bg-white border border-slate-300 rounded text-xs px-2 py-1"
                              autoFocus
                            />
                            <button onClick={() => handleSaveStatusEdit(index)} className="text-emerald-600"><span className="material-symbols-outlined text-lg">check</span></button>
                            <button onClick={() => setEditingStatusIndex(null)} className="text-red-500"><span className="material-symbols-outlined text-lg">close</span></button>
                         </div>
                       ) : (
                         <>
                            <span className="text-sm font-medium text-slate-700">{st}</span>
                            <div className="flex gap-1">
                               <button onClick={() => handleEditStatus(index)} className="p-1.5 text-slate-400 hover:text-accent hover:bg-white rounded-md transition-colors">
                                 <span className="material-symbols-outlined text-lg">edit</span>
                               </button>
                               <button onClick={() => requestDeleteStatus(index)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-md transition-colors">
                                 <span className="material-symbols-outlined text-lg">delete</span>
                               </button>
                            </div>
                         </>
                       )}
                    </div>
                 ))}
              </div>

              <div className="pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-500 mb-2">Adicionar Novo Status</label>
                  <div className="flex gap-2">
                     <input 
                       type="text" 
                       value={newStatusName} 
                       onChange={e => setNewStatusName(e.target.value)}
                       placeholder="Ex: Em Negociação" 
                       className="flex-1 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-accent focus:border-accent" 
                     />
                     <button 
                       onClick={handleAddStatus} 
                       disabled={!newStatusName}
                       className="bg-primary text-white px-4 rounded-lg shadow-lg shadow-primary/20 disabled:opacity-50"
                     >
                        <span className="material-symbols-outlined">add</span>
                     </button>
                  </div>
              </div>

              <button onClick={() => setShowStatusModal(false)} className="w-full mt-6 py-2 text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-medium">Fechar</button>
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

export default Leads;