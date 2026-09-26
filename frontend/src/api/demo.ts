/*
 * Demo backend: same Api as the FastAPI client, but data lives in this browser only.
 * Used for previews (npm run dev:demo / build:demo) so the site works without a server.
 */
import { hubLabel, hubName, matchHub, placeName, routeBetween, HUBS, BORDERS } from '../lib/network';
import type { Api, Load, LoadEvent, Quote, Review, Tracking, User } from './types';

const KEY = 'ell-demo-v7';
const H = 3600e3, D = 24 * H;
const iso = (msAgo: number) => new Date(Date.now() - msAgo).toISOString();
const day = (daysFromNow: number) => new Date(Date.now() + daysFromNow * D).toISOString().slice(0, 10);
const ALPH = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const code = (n: number) => Array.from({ length: n }, () => ALPH[Math.floor(Math.random() * ALPH.length)]).join('');
const quoteRef = () => { const d = new Date(), p = (x: number) => String(x).padStart(2, '0'); return `Q${String(d.getFullYear()).slice(2)}${p(d.getMonth() + 1)}${p(d.getDate())}-${code(4)}`; };

// Reviews start empty on purpose: the site never shows made-up customer reviews.
interface Store { v: 6; seq: number; quotes: Quote[]; loads: Load[]; reviews: Review[] }
let mem: Store | null = null;
let user: User | null = null;

function seed(): Store {
  const q = (o: Partial<Quote> & Pick<Quote, 'id' | 'name' | 'phone' | 'pickup' | 'delivery' | 'cargo'>, hoursAgo: number): Quote => {
    const a = matchHub(o.pickup) || '', b = matchHub(o.delivery) || '';
    const km = routeBetween(a, b)?.best.km ?? 0;
    return {
      ref: `Q-DEMO-0${o.id}`, service: 'One-off load', company: '', email: '', weight: null, truck: 'Not sure, please advise',
      loadDate: null, notes: '', status: 'new', rate: null, currency: 'ZMW', internalNotes: '', loadRef: null, source: 'website',
      fromHub: a, toHub: b, km, createdAt: iso(hoursAgo * H), updatedAt: iso(hoursAgo * H), ...o
    } as Quote;
  };
  const ev = (hoursAgo: number, status: string, at: string, note = ''): LoadEvent => ({ status, at, location: placeName(at), note, createdAt: iso(hoursAgo * H) });
  const L = (id: number, ref: string, from: string, to: string, events: LoadEvent[], o: Partial<Load>): Load => {
    const last = events[events.length - 1];
    return {
      id, ref, quoteId: null, customer: '', customerPhone: '', customerEmail: '', cargo: '', weight: null, truckType: '', truckReg: '',
      driver: '', driverPhone: '', loadDate: null, eta: null, rate: null, currency: 'ZMW', notes: '',
      origin: hubLabel(from), destination: hubLabel(to), fromHub: from, toHub: to,
      status: last.status, at: last.at, location: last.location, publicNote: last.note,
      createdAt: events[0].createdAt, updatedAt: last.createdAt, events, ...o
    };
  };
  const quotes: Quote[] = [
    q({ id: 1, service: 'Dedicated truck hire (daily or monthly)', name: 'Chanda Mwila', company: 'Mwila Poultry (sample)', phone: '+260 97 000 0101', email: 'orders@example.com', pickup: 'Lusaka, Zambia', delivery: 'Kitwe, Zambia', cargo: 'Chilled or frozen food', weight: 5, truck: 'Refrigerated truck (3 to 5 t)', loadDate: day(5), notes: 'Frozen chicken to our Copperbelt outlets, 30-day contract.' }, 2),
    q({ id: 2, name: 'Thandiwe Banda', company: 'Western Traders (sample)', phone: '+260 97 000 0202', pickup: 'Lusaka, Zambia', delivery: 'Mongu, Zambia', cargo: 'General or palletised', weight: 3, loadDate: day(3) }, 5),
    q({ id: 3, name: 'Mutale Bwalya', company: 'Copperbelt Dairies (sample)', phone: '+260 96 000 0303', pickup: 'Kitwe, Zambia', delivery: 'Livingstone, Zambia', cargo: 'Chilled or frozen food', weight: 4, truck: 'Refrigerated truck (3 to 5 t)', status: 'won', rate: 14500, loadRef: 'ELL-7K3Q9', internalNotes: 'Accepted on WhatsApp.' }, 26),
    q({ id: 4, name: 'Grace Phiri', company: 'Phiri General Dealers (sample)', phone: '+260 95 000 0404', pickup: 'Lusaka, Zambia', delivery: 'Chipata, Zambia', cargo: 'Beverages and groceries', weight: 3, truck: 'Containerised truck (2 to 3 t)', status: 'won', rate: 9500, loadRef: 'ELL-2HX8P' }, 72),
    q({ id: 5, name: 'Peter Banda', phone: '+260 97 000 0505', pickup: 'Solwezi, Zambia', delivery: 'Lusaka, Zambia', cargo: 'Building materials', weight: 12, truck: 'Bigger than 5 t', status: 'lost', rate: 21000, internalNotes: 'Needed a bigger truck than we have.' }, 144)
  ];
  const loads: Load[] = [
    L(1, 'ELL-7K3Q9', 'kitwe', 'livingstone', [ev(29, 'Booked', 'kitwe'), ev(14, 'Loaded', 'kitwe', 'Loaded and sealed, reefer set to 2°C.'), ev(9, 'In transit', 'kabwe'), ev(3, 'In transit', 'lusaka', 'Passed Lusaka, heading south on the T1. Reefer holding at 2°C.')],
      { quoteId: 3, customer: 'Copperbelt Dairies (sample)', customerPhone: '+260 96 000 0303', cargo: 'Chilled dairy', weight: 4.5, truckType: 'Refrigerated truck (3 to 5 t)', truckReg: 'ABC 1021', driver: 'Joseph Tembo', driverPhone: '+260 97 000 0606', rate: 14500, eta: day(1) }),
    L(2, 'ELL-2HX8P', 'lusaka', 'chipata', [ev(36, 'Booked', 'lusaka'), ev(0.7, 'Loaded', 'lusaka', 'Departing this afternoon on the Great East Road.')],
      { quoteId: 4, customer: 'Phiri General Dealers (sample)', customerPhone: '+260 95 000 0404', cargo: 'Beverages and groceries', weight: 3, truckType: 'Containerised truck (2 to 3 t)', truckReg: 'ABD 7712', driver: 'Kelvin Mulenga', driverPhone: '+260 97 000 0808', rate: 9500, eta: day(1) }),
    L(3, 'ELL-B7N3K', 'lusaka', 'solwezi', [ev(6, 'Booked', 'lusaka', 'Loads when the refrigerated truck is back from Livingstone.')],
      { customer: 'Mwila Poultry (sample)', customerPhone: '+260 97 000 0101', cargo: 'Frozen chicken', weight: 5, truckType: 'Refrigerated truck (3 to 5 t)', truckReg: 'ABC 1021', driver: 'Isaac Daka', driverPhone: '+260 97 000 1010', rate: 11800, eta: day(4) }),
    L(4, 'ELL-M4TR2', 'lusaka', 'kitwe', [ev(108, 'Booked', 'lusaka'), ev(96, 'Loaded', 'lusaka'), ev(89, 'In transit', 'kabwe'), ev(79, 'Delivered', 'kitwe', 'Delivered and signed for.')],
      { customer: 'Kafue Foods (sample)', customerPhone: '+260 97 000 0909', cargo: 'Bagged mealie meal', weight: 3, truckType: 'Containerised truck (2 to 3 t)', truckReg: 'ABD 7712', driver: 'Moses Zulu', driverPhone: '+260 97 000 0707', rate: 7200, eta: day(-3) }),
    L(5, 'ELL-9CWD5', 'lusaka', 'kasama', [ev(240, 'Booked', 'lusaka'), ev(230, 'Loaded', 'lusaka'), ev(216, 'In transit', 'serenje'), ev(202, 'In transit', 'mpika'), ev(180, 'Delivered', 'kasama', 'Delivered and signed for.')],
      { customer: 'Northern Millers (sample)', customerPhone: '+260 97 000 1111', cargo: 'Bagged mealie meal', weight: 3, truckType: 'Containerised truck (2 to 3 t)', truckReg: 'ABD 7712', driver: 'Joseph Tembo', driverPhone: '+260 97 000 0606', rate: 10500, eta: day(-7) })
  ];
  return { v: 6, seq: 100, quotes, loads, reviews: [] };
}

function read(): Store {
  if (mem) return mem;
  try { const raw = localStorage.getItem(KEY); if (raw) mem = JSON.parse(raw); } catch { /* storage blocked */ }
  if (!mem || mem.v !== 6) { mem = seed(); save(); }
  return mem;
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch { /* keep in memory */ } }
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const byUpdated = (a: { updatedAt: string }, b: { updatedAt: string }) => b.updatedAt.localeCompare(a.updatedAt);
const findLoad = (ref: string) => { const l = read().loads.find(x => x.ref === ref.toUpperCase()); if (!l) throw new Error('Load not found.'); return l; };

export const demoApi: Api = {
  mode: 'demo',
  async submitQuote(input) {
    const s = read();
    const a = matchHub(input.pickup) || '', b = matchHub(input.delivery) || '';
    const km = routeBetween(a, b)?.best.km ?? 0;
    const ref = quoteRef();
    if (!input.website) {
      const now = new Date().toISOString();
      const { website: _honeypot, ...rest } = input;
      void _honeypot;
      s.quotes.push({ ...rest, id: ++s.seq, ref, fromHub: a, toHub: b, km, status: 'new', rate: null, currency: 'ZMW', internalNotes: '', loadRef: null, source: 'website', createdAt: now, updatedAt: now });
      save();
    }
    return { ref, km, fromHub: a, toHub: b };
  },
  async getTracking(ref) {
    const l = read().loads.find(x => x.ref === ref.toUpperCase());
    if (!l) return null;
    const t: Tracking = { ref: l.ref, origin: l.origin, destination: l.destination, fromHub: l.fromHub, toHub: l.toHub, status: l.status, at: l.at, location: l.location, eta: l.eta, note: l.publicNote, updatedAt: l.updatedAt, events: clone(l.events) };
    return t;
  },
  async login() { user = { id: 1, email: 'demo@expeditors.local', name: 'Demo user' }; return user; },
  logout() { user = null; },
  async me() { return user; },
  async listQuotes() { return clone(read().quotes).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); },
  async updateQuote(id, patch) {
    const q = read().quotes.find(x => x.id === id);
    if (!q) throw new Error('Quote not found.');
    Object.assign(q, patch, { updatedAt: new Date().toISOString() });
    if (patch.rate && !patch.status && q.status === 'new') q.status = 'quoted';
    save();
    return clone(q);
  },
  async listLoads() { return clone(read().loads).sort(byUpdated); },
  async createLoad(input) {
    const s = read(), now = new Date().toISOString();
    let ref = `ELL-${code(5)}`;
    while (s.loads.some(l => l.ref === ref)) ref = `ELL-${code(5)}`;
    const { quoteId, ...details } = input;
    const load: Load = {
      ...details, id: ++s.seq, ref, quoteId, origin: hubLabel(input.fromHub), destination: hubLabel(input.toHub),
      status: 'Booked', at: input.fromHub, location: hubName(input.fromHub), publicNote: '', createdAt: now, updatedAt: now,
      events: [{ status: 'Booked', at: input.fromHub, location: hubName(input.fromHub), note: input.loadDate ? `Loading ${input.loadDate}` : '', createdAt: now }]
    };
    s.loads.push(load);
    if (quoteId) { const q = s.quotes.find(x => x.id === quoteId); if (q) Object.assign(q, { status: 'won', loadRef: ref, updatedAt: now }); }
    save();
    return clone(load);
  },
  async updateLoad(ref, patch) {
    const l = findLoad(ref);
    Object.assign(l, patch, { updatedAt: new Date().toISOString() });
    save();
    return clone(l);
  },
  async addEvent(ref, e) {
    const l = findLoad(ref), now = new Date().toISOString();
    const at = HUBS[e.at] || BORDERS[e.at] ? e.at : '';
    const location = e.location || (at ? placeName(at) : '');
    if (!location) throw new Error('Say where the truck is.');
    l.events.push({ status: e.status, at, location, note: e.note, createdAt: now });
    Object.assign(l, { status: e.status, at, location, publicNote: e.note, updatedAt: now, ...(e.eta ? { eta: e.eta } : {}) });
    save();
    return clone(l);
  },
  async deleteLoad(ref) {
    const s = read();
    s.loads = s.loads.filter(l => l.ref !== ref);
    s.quotes.forEach(q => { if (q.loadRef === ref) q.loadRef = null; });
    save();
  },
  async getReviews() {
    const shown = read().reviews.filter(r => r.status === 'approved').sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const average = shown.length ? Math.round((shown.reduce((n, r) => n + r.rating, 0) / shown.length) * 10) / 10 : null;
    return { average, count: shown.length, reviews: shown.map(({ id, name, company, town, rating, comment, createdAt }) => ({ id, name, company, town, rating, comment, createdAt })) };
  },
  async submitReview(input) {
    if (input.website) return;
    const s = read(), now = new Date().toISOString();
    const { website: _honeypot, ...rest } = input;
    void _honeypot;
    s.reviews.push({ ...rest, id: ++s.seq, status: 'pending', createdAt: now, updatedAt: now });
    save();
  },
  async listAllReviews() { return clone(read().reviews).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); },
  async setReviewStatus(id, status) {
    const r = read().reviews.find(x => x.id === id);
    if (!r) throw new Error('Review not found.');
    Object.assign(r, { status, updatedAt: new Date().toISOString() });
    save();
    return clone(r);
  },
  async deleteReview(id) { const s = read(); s.reviews = s.reviews.filter(r => r.id !== id); save(); },
  async resetDemo() { mem = seed(); save(); }
};
