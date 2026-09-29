import { COMPANY } from '../config';
import { absoluteHref } from './router';

export const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
export const digits = (s: unknown) => String(s ?? '').replace(/\D/g, '');
export const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const smooth = (): ScrollBehavior => (reduceMotion() ? 'auto' : 'smooth');
export const firstName = (name: string) => String(name || '').trim().split(/\s+/)[0] || 'there';

type DateLike = string | number | Date | null | undefined;
const toDate = (v: DateLike) => (v instanceof Date ? v : new Date(typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v + 'T00:00' : (v as string | number)));

export function fmtDateTime(v: DateLike) {
  if (!v) return '-';
  const d = toDate(v);
  return isNaN(+d) ? String(v) : d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
export function fmtDay(v: DateLike, withYear = false) {
  if (!v) return '-';
  const d = toDate(v);
  return isNaN(+d) ? String(v) : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) });
}
export function ago(v: DateLike) {
  if (!v) return '';
  const s = Math.round((Date.now() - toDate(v).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.round(s / 60); if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60); if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24); if (d < 30) return `${d} d ago`;
  return fmtDay(v, true);
}
export const todayISO = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
export const addDaysISO = (iso: string, days: number) => { const d = new Date(iso + 'T00:00'); d.setDate(d.getDate() + days); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };

export function money(amount: number | null | undefined, currency?: string) {
  if (amount === null || amount === undefined || isNaN(+amount)) return '';
  return `${currency || ''} ${(+amount).toLocaleString('en-US', { maximumFractionDigits: 2 })}`.trim();
}

/** WhatsApp link to a number (defaults to the company number). */
export function waLink(text: string, number: string = COMPANY.whatsapp) {
  const n = digits(number);
  if (!n) return '';
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

/** Local Zambian (09x/07x) and South African (0xx) numbers get their country code for wa.me and tel: links. */
export function toIntl(phone: string, fromCountry: 'ZM' | 'ZA' = 'ZM') {
  let n = digits(phone);
  if (!n) return '';
  if (n.startsWith('00')) n = n.slice(2);
  if (n.startsWith('0')) n = (fromCountry === 'ZA' ? '27' : '260') + n.slice(1);
  return n;
}

/** Link a customer can open to follow their load, e.g. https://example.com/track/ELL-7K3Q9 */
export const trackingLink = (ref: string) => absoluteHref({ page: 'track', track: ref }, COMPANY.siteUrl);
