import { createContext, useContext } from 'react';
import type { Load, LoadInput, Quote, Review, User } from '../api';

export interface MessageRequest { to: string; phone: string; text: string; title?: string }

export interface AdminState {
  user: User;
  quotes: Quote[];
  loads: Load[];
  reviews: Review[];
  refresh(): Promise<void>;
  openQuote(id: number): void;
  openLoad(ref: string): void;
  openNewLoad(prefill?: Partial<LoadInput>): void;
  closeDrawer(): void;
  message(m: MessageRequest): void;
}

export const AdminCtx = createContext<AdminState | null>(null);
export function useAdmin() {
  const v = useContext(AdminCtx);
  if (!v) throw new Error('useAdmin must be used inside the portal');
  return v;
}

export const QUOTE_STATUS: [Quote['status'], string][] = [['new', 'New'], ['quoted', 'Quoted'], ['won', 'Won'], ['lost', 'Lost']];
export const TRUCKS = ['Refrigerated truck (3 to 5 t)', 'Containerised truck (2 to 3 t)', 'Other'];
export const statusClass = (s: string) => 'st-' + String(s || '').toLowerCase().replace(/\s+/g, '-');
