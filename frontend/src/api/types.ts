/* Types for the Expeditors API (camelCase JSON, matching backend/app/schemas). */
import type { Stage } from '../lib/network';

export type QuoteStatus = 'new' | 'quoted' | 'won' | 'lost';

export interface User { id: number; email: string; name: string }

export interface QuoteInput {
  service: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  pickup: string;
  delivery: string;
  cargo: string;
  weight: number | null;
  truck: string;
  loadDate: string | null;
  notes: string;
  /** Honeypot: stays empty for real visitors. */
  website: string;
}
export interface QuoteReceipt { ref: string; km: number; fromHub: string; toHub: string }

export interface Quote extends Omit<QuoteInput, 'website'> {
  id: number;
  ref: string;
  fromHub: string;
  toHub: string;
  km: number;
  status: QuoteStatus;
  rate: number | null;
  currency: string;
  internalNotes: string;
  loadRef: string | null;
  source: string;
  createdAt: string;
  updatedAt: string;
}
export interface QuotePatch { status?: QuoteStatus; rate?: number | null; currency?: string; internalNotes?: string }

export interface LoadEvent { status: Stage | string; at: string; location: string; note: string; createdAt: string }

export interface LoadDetails {
  customer: string;
  customerPhone: string;
  customerEmail: string;
  cargo: string;
  weight: number | null;
  truckType: string;
  truckReg: string;
  driver: string;
  driverPhone: string;
  loadDate: string | null;
  eta: string | null;
  rate: number | null;
  currency: string;
  notes: string;
}
export interface LoadInput extends LoadDetails { fromHub: string; toHub: string; quoteId: number | null }
export type LoadPatch = Partial<LoadDetails> & { publicNote?: string };

export interface Load extends LoadDetails {
  id: number;
  ref: string;
  quoteId: number | null;
  origin: string;
  destination: string;
  fromHub: string;
  toHub: string;
  status: Stage | string;
  at: string;
  location: string;
  publicNote: string;
  createdAt: string;
  updatedAt: string;
  events: LoadEvent[];
}
export interface EventInput { status: Stage; at: string; location: string; note: string; eta: string | null }

export interface Tracking {
  ref: string;
  origin: string;
  destination: string;
  fromHub: string;
  toHub: string;
  status: string;
  at: string;
  location: string;
  eta: string | null;
  note: string;
  updatedAt: string;
  events: LoadEvent[];
  sample?: boolean;
}

export type ReviewStatus = 'pending' | 'approved' | 'hidden';
export interface ReviewInput {
  name: string;
  company: string;
  town: string;
  rating: number;
  comment: string;
  /** Phone or email, kept private: lets the team confirm the reviewer is a real customer. */
  contact: string;
  loadRef: string;
  /** Honeypot: stays empty for real visitors. */
  website: string;
}
export interface PublicReview { id: number; name: string; company: string; town: string; rating: number; comment: string; createdAt: string }
export interface ReviewSummary { average: number | null; count: number; reviews: PublicReview[] }
export interface Review extends PublicReview { contact: string; loadRef: string; status: ReviewStatus; updatedAt: string }

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Everything the website and the portal need from a backend. Implemented by http.ts (FastAPI) and demo.ts (browser). */
export interface Api {
  mode: 'live' | 'demo';
  submitQuote(q: QuoteInput): Promise<QuoteReceipt>;
  getTracking(ref: string): Promise<Tracking | null>;

  login(email: string, password: string): Promise<User>;
  logout(): void;
  me(): Promise<User | null>;

  listQuotes(): Promise<Quote[]>;
  updateQuote(id: number, patch: QuotePatch): Promise<Quote>;

  listLoads(): Promise<Load[]>;
  createLoad(input: LoadInput): Promise<Load>;
  updateLoad(ref: string, patch: LoadPatch): Promise<Load>;
  addEvent(ref: string, ev: EventInput): Promise<Load>;
  deleteLoad(ref: string): Promise<void>;

  getReviews(): Promise<ReviewSummary>;
  submitReview(r: ReviewInput): Promise<void>;
  listAllReviews(): Promise<Review[]>;
  setReviewStatus(id: number, status: ReviewStatus): Promise<Review>;
  deleteReview(id: number): Promise<void>;

  resetDemo?(): Promise<void>;
}
