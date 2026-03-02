export type NavigationItem = 'home' | 'rotina' | 'leads' | 'copilot' | 'financeiro' | 'contratos' | 'goals' | 'profile';

// ============================================
// CRM / LEADS
// ============================================

export type InteractionType = 'ligacao' | 'whatsapp' | 'email' | 'visita' | 'reuniao' | 'follow_up' | 'proposta' | 'outro';

export interface Interaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: InteractionType;
  description: string;
  taskId?: string;
  createdAt: number;
}

export interface LeadProperty {
  id: string;
  title: string;
  location?: string;
  value?: number;
  notes?: string;
}

export interface Lead {
  id: string;
  name: string;
  status: string;
  value: number;
  phone: string;
  email?: string;
  birthday?: string; // YYYY-MM-DD
  lastInteraction: string; // YYYY-MM-DD
  notes?: string;
  properties: LeadProperty[];
  interactions: Interaction[];
}

export const INTERACTION_TYPE_LABELS: Record<InteractionType, string> = {
  ligacao: 'Ligação',
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  visita: 'Visita',
  reuniao: 'Reunião',
  follow_up: 'Follow-up',
  proposta: 'Proposta',
  outro: 'Outro',
};

export const INTERACTION_TYPE_ICONS: Record<InteractionType, string> = {
  ligacao: 'call',
  whatsapp: 'chat',
  email: 'mail',
  visita: 'location_on',
  reuniao: 'groups',
  follow_up: 'phone_callback',
  proposta: 'description',
  outro: 'more_horiz',
};

// ============================================
// TAREFAS (Rotina)
// ============================================

export type TaskType = 'geral' | 'follow_up' | 'visita' | 'ligacao' | 'marketing' | 'administrativo';

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  date: string; // YYYY-MM-DD
  type: TaskType;
  leadId?: string;
  createdAt: number;
}

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  geral: 'Geral',
  follow_up: 'Follow-up',
  visita: 'Visita',
  ligacao: 'Ligação',
  marketing: 'Marketing',
  administrativo: 'Administrativo',
};

export const TASK_TYPE_ICONS: Record<TaskType, string> = {
  geral: 'task_alt',
  follow_up: 'phone_callback',
  visita: 'location_on',
  ligacao: 'call',
  marketing: 'campaign',
  administrativo: 'folder',
};

export const TASK_TYPE_COLORS: Record<TaskType, string> = {
  geral: 'bg-slate-100 text-slate-600',
  follow_up: 'bg-orange-100 text-orange-700',
  visita: 'bg-blue-100 text-blue-700',
  ligacao: 'bg-green-100 text-green-700',
  marketing: 'bg-purple-100 text-purple-700',
  administrativo: 'bg-amber-100 text-amber-700',
};

// ============================================
// COPILOTO IA
// ============================================

export interface AIAction {
  type: 'create_task' | 'create_lead' | 'create_financial' | 'create_contract' | 'suggest_tasks';
  data: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  action?: AIAction;
  actionExecuted?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastModified: number;
}

export interface AIContext {
  user: UserProfile;
  leads: Lead[];
  tasks: Task[];
  financialEntries: FinancialEntry[];
  contracts: ContractTemplate[];
  currentTab: string;
}

export interface Goal {
  id: string;
  title: string;
  currentValue: number;
  targetValue: number;
  type: 'currency' | 'number';
  deadline?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  creci: string;
  avatar?: string;
}

// ============================================
// FINANCEIRO
// ============================================

export type FinancialCategory =
  | 'comissao'
  | 'aluguel'
  | 'consultoria'
  | 'combustivel'
  | 'alimentacao'
  | 'marketing'
  | 'transporte'
  | 'escritorio'
  | 'outro';

export interface FinancialEntry {
  id: string;
  type: 'receita' | 'despesa';
  description: string;
  amount: number;
  category: FinancialCategory;
  date: string; // YYYY-MM-DD
  leadId?: string;
  createdAt: number;
}

export const FINANCIAL_CATEGORY_LABELS: Record<FinancialCategory, string> = {
  comissao: 'Comissão',
  aluguel: 'Aluguel',
  consultoria: 'Consultoria',
  combustivel: 'Combustível',
  alimentacao: 'Alimentação',
  marketing: 'Marketing',
  transporte: 'Transporte',
  escritorio: 'Escritório',
  outro: 'Outro',
};

export const FINANCIAL_CATEGORY_ICONS: Record<FinancialCategory, string> = {
  comissao: 'payments',
  aluguel: 'home',
  consultoria: 'support_agent',
  combustivel: 'local_gas_station',
  alimentacao: 'restaurant',
  marketing: 'campaign',
  transporte: 'directions_car',
  escritorio: 'business',
  outro: 'receipt',
};

export const RECEITA_CATEGORIES: FinancialCategory[] = ['comissao', 'aluguel', 'consultoria', 'outro'];
export const DESPESA_CATEGORIES: FinancialCategory[] = ['combustivel', 'alimentacao', 'marketing', 'transporte', 'escritorio', 'outro'];

export interface Property {
  id: string;
  title: string;
  location: string;
  price: string;
  beds: number;
  baths: number;
  sqft: number;
  image: string;
  tag?: string;
}

// ============================================
// CONTRATOS
// ============================================

export interface ContractTemplate {
  id: string;
  title: string;
  content: string; // Texto do contrato com {{PLACEHOLDERS}}
  createdAt: number;
  updatedAt: number;
}

export interface GeneratedContract {
  id: string;
  templateId: string;
  leadId: string;
  filledContent: string; // Contrato com placeholders preenchidos
  createdAt: number;
}