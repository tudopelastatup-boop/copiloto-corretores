import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Rotina from './pages/Rotina';
import Leads from './pages/Leads';
import Financeiro from './pages/Financeiro';
import Chat from './pages/Chat';
import Goals from './pages/Goals';
import Profile from './pages/Profile';
import Contratos from './pages/Contratos';
import AIPopup from './components/AIPopup';
import { NavigationItem, Task, Lead, Goal, ChatSession, UserProfile, FinancialEntry, ContractTemplate } from './types';

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

  // 1. Tasks (Rotina)
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Ligar para 5 novos leads', completed: false, date: today, type: 'ligacao', createdAt: Date.now() },
    { id: '2', title: 'Confirmar visitas de amanhã', completed: false, date: today, type: 'visita', leadId: '1', createdAt: Date.now() },
    { id: '3', title: 'Postar stories do imóvel no Leblon', completed: true, date: today, type: 'marketing', createdAt: Date.now() },
    { id: '4', title: 'Follow-up com Mariana', completed: false, date: today, type: 'follow_up', leadId: '2', createdAt: Date.now() },
    { id: '5', title: 'Organizar documentos do apt Leblon', completed: true, date: today, type: 'administrativo', createdAt: Date.now() },
    { id: '6', title: 'Responder emails pendentes', completed: false, date: getDateDaysAgo(1), type: 'geral', createdAt: Date.now() },
    { id: '7', title: 'Visitar imóvel na Barra', completed: true, date: getDateDaysAgo(1), type: 'visita', createdAt: Date.now() },
  ]);

  // 2. Leads & Statuses
  const [leads, setLeads] = useState<Lead[]>([
    {
      id: '1', name: 'Roberto Silva', status: 'Quente', value: 1500000, phone: '5511999999999',
      email: 'roberto@email.com', birthday: '1985-05-15', lastInteraction: today,
      notes: 'Muito interessado no apto do Leblon',
      properties: [
        { id: 'p1', title: 'Apto 3q Leblon', location: 'Leblon, RJ', value: 1200000 },
      ],
      interactions: [
        { id: 'i1', date: today, type: 'ligacao', description: 'Conversamos sobre o apto do Leblon. Interesse alto.', createdAt: Date.now() },
        { id: 'i2', date: getDateDaysAgo(2), type: 'whatsapp', description: 'Enviou fotos do imóvel. Pediu para agendar visita.', createdAt: Date.now() },
        { id: 'i3', date: getDateDaysAgo(5), type: 'visita', description: 'Visitou apto no Leblon, gostou muito.', createdAt: Date.now() },
      ],
    },
    {
      id: '2', name: 'Mariana Souza', status: 'Morno', value: 850000, phone: '5511988888888',
      email: 'mariana@email.com', lastInteraction: getDateDaysAgo(2),
      properties: [],
      interactions: [
        { id: 'i4', date: getDateDaysAgo(2), type: 'follow_up', description: 'Retornou contato, ainda avaliando opções.', createdAt: Date.now() },
      ],
    },
    {
      id: '3', name: 'Carlos Andrade', status: 'Frio', value: 2200000, phone: '5511977777777',
      lastInteraction: getDateDaysAgo(5),
      properties: [
        { id: 'p2', title: 'Casa 4q Barra da Tijuca', location: 'Barra da Tijuca, RJ', value: 2200000 },
      ],
      interactions: [
        { id: 'i5', date: getDateDaysAgo(5), type: 'email', description: 'Enviou proposta por email. Sem retorno.', createdAt: Date.now() },
      ],
    },
  ]);
  const [statuses, setStatuses] = useState<string[]>(['Frio', 'Morno', 'Quente', 'Fechado']);

  // 3. Goals
  const [goals, setGoals] = useState<Goal[]>([
    { id: '1', title: 'Vendas Março', currentValue: 15000, targetValue: 50000, type: 'currency' },
    { id: '2', title: 'Novos Leads', currentValue: 12, targetValue: 30, type: 'number' }
  ]);

  // 4. Financial Entries
  const [financialEntries, setFinancialEntries] = useState<FinancialEntry[]>([
    { id: 'f1', type: 'receita', description: 'Comissão venda apt Leblon', amount: 45000, category: 'comissao', date: `${today.slice(0, 7)}-01`, createdAt: Date.now() },
    { id: 'f2', type: 'receita', description: 'Comissão aluguel Ipanema', amount: 3200, category: 'comissao', date: `${today.slice(0, 7)}-10`, createdAt: Date.now() },
    { id: 'f3', type: 'despesa', description: 'Combustível visitas', amount: 800, category: 'combustivel', date: `${today.slice(0, 7)}-05`, createdAt: Date.now() },
    { id: 'f4', type: 'despesa', description: 'Anúncios Instagram', amount: 1200, category: 'marketing', date: `${today.slice(0, 7)}-08`, createdAt: Date.now() },
    { id: 'f5', type: 'receita', description: 'Consultoria imobiliária', amount: 5000, category: 'consultoria', date: getDateDaysAgo(35).slice(0, 7) + '-15', createdAt: Date.now() },
    { id: 'f6', type: 'despesa', description: 'Material escritório', amount: 350, category: 'escritorio', date: getDateDaysAgo(35).slice(0, 7) + '-20', createdAt: Date.now() },
    { id: 'f7', type: 'receita', description: 'Comissão venda casa Barra', amount: 62000, category: 'comissao', date: getDateDaysAgo(65).slice(0, 7) + '-12', createdAt: Date.now() },
    { id: 'f8', type: 'despesa', description: 'Transporte Uber', amount: 450, category: 'transporte', date: getDateDaysAgo(65).slice(0, 7) + '-18', createdAt: Date.now() },
  ]);

  // 5. Contract Templates
  const [contracts, setContracts] = useState<ContractTemplate[]>([
    {
      id: 'ct1',
      title: 'Contrato de Compra e Venda Padrão',
      content: `CONTRATO DE COMPRA E VENDA DE IMÓVEL

As partes abaixo identificadas celebram o presente contrato de compra e venda de imóvel, nos termos e condições seguintes:

VENDEDOR: {{NOME_CORRETOR}}, CRECI {{CRECI}}, representando o proprietário do imóvel.

COMPRADOR: {{NOME_COMPRADOR}}, CPF {{CPF_COMPRADOR}}.

IMÓVEL: Localizado em {{ENDERECO_IMOVEL}}.

VALOR: R$ {{VALOR_IMOVEL}} (reais), a ser pago conforme condições acordadas entre as partes.

DATA: {{DATA}}

Cláusula 1ª - O vendedor se compromete a entregar o imóvel livre de quaisquer ônus ou pendências.

Cláusula 2ª - O comprador se compromete a efetuar o pagamento conforme acordado.

Cláusula 3ª - As partes elegem o foro da comarca do imóvel para dirimir eventuais controvérsias.

_________________________
{{NOME_CORRETOR}} - Corretor
CRECI: {{CRECI}}

_________________________
{{NOME_COMPRADOR}} - Comprador`,
      createdAt: Date.now() - 86400000 * 5,
      updatedAt: Date.now() - 86400000 * 5,
    },
    {
      id: 'ct2',
      title: 'Contrato de Locação Residencial',
      content: `CONTRATO DE LOCAÇÃO RESIDENCIAL

Pelo presente instrumento particular de locação, as partes:

LOCADOR: {{NOME_CORRETOR}}, CRECI {{CRECI}}, representando o proprietário.

LOCATÁRIO: {{NOME_COMPRADOR}}, CPF {{CPF_COMPRADOR}}.

IMÓVEL: {{ENDERECO_IMOVEL}}

VALOR DO ALUGUEL: R$ {{VALOR_IMOVEL}} mensais.

DATA DE INÍCIO: {{DATA}}

Cláusula 1ª - O prazo da locação é de 30 (trinta) meses.

Cláusula 2ª - O aluguel será pago até o dia 5 de cada mês.

Cláusula 3ª - O locatário se obriga a manter o imóvel em boas condições.

Cláusula 4ª - Fica eleito o foro da comarca do imóvel.

_________________________
{{NOME_CORRETOR}} - Corretor
CRECI: {{CRECI}}

_________________________
{{NOME_COMPRADOR}} - Locatário`,
      createdAt: Date.now() - 86400000 * 2,
      updatedAt: Date.now() - 86400000 * 2,
    },
  ]);

  // 6. Chat Sessions
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
        return <Dashboard tasks={tasks} leads={leads} financialEntries={financialEntries} userName={user.name} onNavigate={setActiveTab} />;
      case 'rotina':
        return <Rotina tasks={tasks} setTasks={setTasks} leads={leads} />;
      case 'leads':
        return <Leads leads={leads} setLeads={setLeads} statuses={statuses} setStatuses={setStatuses} tasks={tasks} setTasks={setTasks} />;
      case 'financeiro':
        return <Financeiro entries={financialEntries} setEntries={setFinancialEntries} leads={leads} />;
      case 'contratos':
        return <Contratos contracts={contracts} setContracts={setContracts} leads={leads} user={user} />;
      case 'copilot':
        return (
          <Chat
            sessions={sessions}
            setSessions={setSessions}
            leads={leads}
            setLeads={setLeads}
            tasks={tasks}
            setTasks={setTasks}
            financialEntries={financialEntries}
            setFinancialEntries={setFinancialEntries}
            contracts={contracts}
            user={user}
            activeTab={activeTab}
          />
        );
      case 'goals':
        return <Goals goals={goals} setGoals={setGoals} />;
      case 'profile':
        return <Profile user={user} setUser={setUser} />;
      default:
        return <Dashboard tasks={tasks} leads={leads} financialEntries={financialEntries} userName={user.name} onNavigate={setActiveTab} />;
    }
  };

  return (
    <Layout activeTab={activeTab} onNavigate={setActiveTab}>
      {renderContent()}
      <AIPopup
        leads={leads}
        setLeads={setLeads}
        tasks={tasks}
        setTasks={setTasks}
        financialEntries={financialEntries}
        setFinancialEntries={setFinancialEntries}
        contracts={contracts}
        user={user}
        activeTab={activeTab}
      />
    </Layout>
  );
};

export default App;