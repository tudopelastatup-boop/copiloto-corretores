export type NavigationItem = 'home' | 'leads' | 'copilot' | 'goals' | 'profile';

export interface Lead {
  id: string;
  name: string;
  status: string; // Changed from literal union to string to allow custom statuses
  value: number; // Changed to number for math operations
  phone: string;
  email?: string;
  lastInteraction: string; // YYYY-MM-DD
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  date: string; // YYYY-MM-DD
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastModified: number;
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