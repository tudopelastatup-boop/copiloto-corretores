import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Chat from './pages/Chat';
import Goals from './pages/Goals';
import Profile from './pages/Profile';
import { NavigationItem, Task, Lead, Goal, ChatSession, UserProfile } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavigationItem>('home');
  const today = new Date().toISOString().split('T')[0];
  
  // Helper for mock dates
  const getDateDaysAgo = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  };

  // Global State Lifting

  // 1. Dashboard Tasks
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Ligar para 5 novos leads', completed: false, date: today },
    { id: '2', title: 'Confirmar visitas de amanhã', completed: false, date: today },
    { id: '3', title: 'Postar stories do imóvel no Leblon', completed: true, date: today },
  ]);

  // 2. Leads & Statuses
  const [leads, setLeads] = useState<Lead[]>([
    { id: '1', name: 'Roberto Silva', status: 'Quente', value: 1500000, phone: '5511999999999', lastInteraction: today },
    { id: '2', name: 'Mariana Souza', status: 'Morno', value: 850000, phone: '5511999999999', lastInteraction: getDateDaysAgo(2) },
    { id: '3', name: 'Carlos Andrade', status: 'Frio', value: 2200000, phone: '5511999999999', lastInteraction: getDateDaysAgo(5) },
  ]);
  const [statuses, setStatuses] = useState<string[]>(['Frio', 'Morno', 'Quente', 'Fechado']);

  // 3. Goals
  const [goals, setGoals] = useState<Goal[]>([
    { id: '1', title: 'Vendas Março', currentValue: 15000, targetValue: 50000, type: 'currency' },
    { id: '2', title: 'Novos Leads', currentValue: 12, targetValue: 30, type: 'number' }
  ]);

  // 4. Chat Sessions
  const [sessions, setSessions] = useState<ChatSession[]>([
    { 
      id: '1', 
      title: 'Dúvida sobre Contratos', 
      lastModified: Date.now(), 
      messages: [
        { id: '1', sender: 'ai', text: 'Olá! Como posso ajudar com seus contratos hoje?' }
      ] 
    }
  ]);

  // 5. User Profile
  const [user, setUser] = useState<UserProfile>({
    name: 'James Broker',
    email: 'james@imobpilot.com',
    phone: '(11) 99999-9999',
    creci: '12345-F'
  });

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Dashboard tasks={tasks} setTasks={setTasks} />;
      case 'leads':
        return <Leads leads={leads} setLeads={setLeads} statuses={statuses} setStatuses={setStatuses} />;
      case 'copilot':
        return <Chat sessions={sessions} setSessions={setSessions} />;
      case 'goals':
        return <Goals goals={goals} setGoals={setGoals} />;
      case 'profile':
        return <Profile user={user} setUser={setUser} />;
      default:
        return <Dashboard tasks={tasks} setTasks={setTasks} />;
    }
  };

  return (
    <Layout activeTab={activeTab} onNavigate={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default App;