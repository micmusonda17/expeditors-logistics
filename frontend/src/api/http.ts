/* Api implementation that talks to the FastAPI backend. */
import { API_URL } from '../config';
import { ApiError, type Api, type Load, type Quote, type Review, type ReviewSummary, type Tracking, type User } from './types';

// After a staff member signs in, their token is kept in the browser under this name.
const TOKEN_KEY = 'ell-token';
const getToken = () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } };
const setToken = (t: string | null) => { try { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); } catch { /* storage blocked */ } };

type Listener = () => void;
const unauthorized = new Set<Listener>();
/** Called when the API rejects the saved token, so the portal can show the sign-in screen. */
export const onUnauthorized = (fn: Listener) => { unauthorized.add(fn); return () => { unauthorized.delete(fn); }; };

function messageFrom(body: unknown, fallback: string): string {
  const detail = (body as { detail?: unknown })?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg).replace(/^Value error, /, '');
  return fallback;
}

// Every call to the backend goes through here: it sends the request, adds the staff token
// when `auth` is true, and turns error replies into a readable message.
async function request<T>(path: string, init: RequestInit = {}, auth = false): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (init.body) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  let res: Response;
  try {
    res = await fetch(API_URL + path, { ...init, headers: { ...headers, ...(init.headers as Record<string, string>) } });
  } catch {
    throw new ApiError(0, 'Could not reach the server. Check your connection.');
  }
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && auth) { setToken(null); unauthorized.forEach(fn => fn()); }
    throw new ApiError(res.status, messageFrom(body, `Request failed (${res.status})`));
  }
  return body as T;
}

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

// One function per backend endpoint. Each line maps to a row on the /api/docs page.
export const httpApi: Api = {
  mode: 'live',
  submitQuote: q => request('/quotes', json('POST', q)),
  async getTracking(ref) {
    try { return await request<Tracking>(`/tracking/${encodeURIComponent(ref)}`); }
    catch (e) { if (e instanceof ApiError && e.status === 404) return null; throw e; }
  },
  async login(email, password) {
    const res = await request<{ accessToken: string; user: User }>('/auth/login', json('POST', { email, password }));
    setToken(res.accessToken);
    return res.user;
  },
  logout: () => setToken(null),
  async me() {
    if (!getToken()) return null;
    try { return await request<User>('/auth/me', {}, true); }
    catch (e) { if (e instanceof ApiError && e.status === 401) return null; throw e; }
  },
  listQuotes: () => request<Quote[]>('/quotes', {}, true),
  updateQuote: (id, patch) => request<Quote>(`/quotes/${id}`, json('PATCH', patch), true),
  listLoads: () => request<Load[]>('/loads', {}, true),
  createLoad: input => request<Load>('/loads', json('POST', input), true),
  updateLoad: (ref, patch) => request<Load>(`/loads/${ref}`, json('PATCH', patch), true),
  addEvent: (ref, ev) => request<Load>(`/loads/${ref}/events`, json('POST', ev), true),
  deleteLoad: ref => request<void>(`/loads/${ref}`, { method: 'DELETE' }, true),
  getReviews: () => request<ReviewSummary>('/reviews'),
  async submitReview(r) { await request('/reviews', json('POST', r)); },
  listAllReviews: () => request<Review[]>('/reviews/all', {}, true),
  setReviewStatus: (id, status) => request<Review>(`/reviews/${id}`, json('PATCH', { status }), true),
  deleteReview: id => request<void>(`/reviews/${id}`, { method: 'DELETE' }, true)
};
