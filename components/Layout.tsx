import React from 'react';
import { NavigationItem } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: NavigationItem;
  onNavigate: (tab: NavigationItem) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onNavigate }) => {
  
  const NavIcon = ({ icon, label, tab, highlight = false }: { icon: string; label: string; tab: NavigationItem, highlight?: boolean }) => {
    const isActive = activeTab === tab;
    
    if (highlight) {
      return (
        <div className="flex justify-center relative z-10 -mt-6">
           <button
             onClick={() => onNavigate(tab)}
             className={`h-14 w-14 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-95 border-4 border-white tap-highlight-transparent ${
               isActive
                 ? 'bg-accent text-white shadow-accent/40'
                 : 'bg-primary text-white shadow-primary/30'
             }`}
           >
             <span className="material-symbols-outlined text-2xl">smart_toy</span>
           </button>
        </div>
      );
    }

    return (
      <button
        onClick={() => onNavigate(tab)}
        className={`group flex flex-col items-center justify-center gap-1 w-full p-2 transition-all duration-200 tap-highlight-transparent ${
          isActive ? 'text-accent font-semibold' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <span className={`material-symbols-outlined text-2xl transition-transform ${isActive ? 'filled' : ''}`}>
          {icon}
        </span>
        <span className="text-[10px] tracking-wide">{label}</span>
      </button>
    );
  };

  const SidebarIcon = ({ icon, label, tab }: { icon: string; label: string; tab: NavigationItem }) => {
    const isActive = activeTab === tab;
    return (
      <button
        onClick={() => onNavigate(tab)}
        className={`flex items-center gap-4 w-full px-4 py-3 rounded-xl transition-all duration-200 ${
          isActive 
            ? 'bg-primary text-white font-medium shadow-lg shadow-primary/20' 
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <span className={`material-symbols-outlined text-2xl ${isActive ? 'filled' : ''}`}>
          {icon}
        </span>
        <span className="text-sm tracking-wide">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex h-screen w-full bg-bg-light overflow-hidden text-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-slate-200 h-full p-6 shrink-0 z-20 shadow-soft">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/30">
            <span className="material-symbols-outlined text-white text-2xl">token</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-none tracking-tight">ImobPilot</h1>
            <span className="text-[10px] tracking-widest uppercase text-slate-400 font-bold">Copilot MVP</span>
          </div>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          <SidebarIcon icon="dashboard" label="Dashboard" tab="home" />
          <SidebarIcon icon="groups" label="Carteira de Clientes" tab="leads" />
          <SidebarIcon icon="smart_toy" label="Copiloto IA" tab="copilot" />
          <SidebarIcon icon="flag" label="Minhas Metas" tab="goals" />
          <SidebarIcon icon="person" label="Meu Perfil" tab="profile" />
        </nav>

        <div className="mt-auto bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                JB
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">James Broker</p>
                <p className="text-xs text-slate-500 truncate">Premium Member</p>
              </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-hidden relative flex flex-col bg-bg-light">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe px-2 z-50 rounded-t-2xl shadow-[0_-5px_20px_rgba(0,0,0,0.03)]">
        <div className="grid grid-cols-5 h-20 items-center">
          <NavIcon icon="dashboard" label="Home" tab="home" />
          <NavIcon icon="groups" label="Leads" tab="leads" />
          <NavIcon icon="smart_toy" label="Copilot" tab="copilot" highlight={true} />
          <NavIcon icon="flag" label="Metas" tab="goals" />
          <NavIcon icon="person" label="Perfil" tab="profile" />
        </div>
      </div>
    </div>
  );
};

export default Layout;