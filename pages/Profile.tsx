import React from 'react';
import { UserProfile } from '../types';

interface ProfileProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}

const Profile: React.FC<ProfileProps> = ({ user, setUser }) => {

  const handleChange = (field: keyof UserProfile, value: string) => {
    setUser(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-28 md:pb-6 bg-slate-50">
      
      <div className="bg-primary pt-6 pb-10 px-6 rounded-b-[2.5rem] shadow-float relative overflow-hidden">
        {/* Abstract shapes for background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 flex flex-col items-center mt-6">
           <div className="w-24 h-24 rounded-full border-4 border-white/10 p-1 mb-4">
              <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-white text-2xl font-bold">
                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
           </div>
           <h1 className="text-2xl font-bold text-white tracking-tight">{user.name}</h1>
           <p className="text-slate-400 text-sm uppercase tracking-widest mt-1 font-semibold">{user.creci}</p>
        </div>
      </div>

      <div className="px-6 -mt-8 relative z-20 space-y-6 max-w-lg mx-auto">
        
        {/* Settings Form */}
        <div className="bg-white rounded-2xl p-6 shadow-soft border border-slate-100 space-y-4">
           <h3 className="font-bold text-primary mb-2 flex items-center gap-2">
             <span className="material-symbols-outlined text-accent">manage_accounts</span>
             Dados da Conta
           </h3>
           
           <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nome de Exibição</label>
              <input 
                type="text" 
                value={user.name}
                onChange={e => handleChange('name', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-accent focus:border-accent font-medium text-slate-900" 
              />
           </div>

           <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">E-mail</label>
              <input 
                type="email" 
                value={user.email}
                onChange={e => handleChange('email', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-accent focus:border-accent font-medium text-slate-900" 
              />
           </div>

           <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Telefone</label>
              <input 
                type="text" 
                value={user.phone}
                onChange={e => handleChange('phone', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-accent focus:border-accent font-medium text-slate-900" 
              />
           </div>

           <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">CRECI</label>
              <input 
                type="text" 
                value={user.creci}
                onChange={e => handleChange('creci', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-accent focus:border-accent font-medium text-slate-900" 
              />
           </div>

           <div className="pt-4">
             <button className="w-full py-3 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:bg-slate-800 transition-colors">
               Salvar Dados
             </button>
           </div>
        </div>

        <button className="w-full py-3 text-red-500 font-bold text-sm hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100">
           Sair da conta
        </button>

        <div className="text-center pb-6">
           <p className="text-[10px] text-slate-400 font-medium">Versão MVP 1.1.0</p>
        </div>

      </div>
    </div>
  );
};

export default Profile;