/* Route network shared with the backend (shared/network.json): towns, border posts, roads, routes. */
import raw from '@shared/network.json';

export type LatLon = [number, number];
export type LabelPos = 'r' | 'l' | 't' | 'b' | 'rb';

export interface Hub {
  name: string;
  country: string;
  ll: LatLon;
  label: LabelPos;
  port?: boolean;
  minor?: boolean;
  small?: boolean;
  /** 1 = label only when zoomed in, 2 = only when zoomed right in */
  zoom?: 1 | 2;
  region?: 'limpopo';
}
export interface Border { name: string; pair: [string, string]; ll: LatLon; label: LabelPos; osbp?: boolean }
export interface Road { from: string; to: string; km: number; via: (string | LatLon)[] }
export interface Corridor { id: string; group: 'zm' | 'sa'; name: string; path: string[]; note: string }
export interface CorridorGroup { id: 'zm' | 'sa'; name: string; tag: string }
export interface Lane { from: string; to: string; soon?: boolean }
export interface Route { nodes: string[]; edges: number[]; km: number }

interface NetworkData {
  countries: Record<string, string>;
  stages: string[];
  hubs: Record<string, Hub>;
  borders: Record<string, Border>;
  roads: Road[];
  corridorGroups: CorridorGroup[];
  corridors: Corridor[];
  lanes: Lane[];
  aliases: Record<string, string>;
}

const data = raw as unknown as NetworkData;

export const COUNTRIES = data.countries;
export const STAGES = data.stages as Stage[];
export const HUBS = data.hubs;
export const BORDERS = data.borders;
export const ROADS = data.roads;
export const CORRIDOR_GROUPS = data.corridorGroups;
export const CORRIDORS = data.corridors;
export const LANES = data.lanes;
export type Stage = 'Booked' | 'Loaded' | 'In transit' | 'At border' | 'Delivered';

/* ---------- Places ---------- */
export const hubName = (k: string) => HUBS[k]?.name ?? k;
export const hubLabel = (k: string) => `${HUBS[k].name}, ${COUNTRIES[HUBS[k].country]}`;
export const placeName = (k: string) =>
  HUBS[k] ? HUBS[k].name : BORDERS[k] ? `${BORDERS[k].name} border (${BORDERS[k].pair.join('/')})` : k;

export function matchHub(text: string | null | undefined): string | null {
  if (!text) return null;
  const t = String(text).toLowerCase().split(',')[0].trim().replace(/\s+/g, ' ');
  if (data.aliases[t]) return data.aliases[t];
  for (const k in HUBS) if (HUBS[k].name.toLowerCase() === t || k === t) return k;
  return null;
}

/* ---------- Routing ---------- */
const ADJ: Record<string, { to: string; km: number; i: number }[]> = {};
ROADS.forEach((r, i) => {
  (ADJ[r.from] ||= []).push({ to: r.to, km: r.km, i });
  (ADJ[r.to] ||= []).push({ to: r.from, km: r.km, i });
});

export function shortest(from: string, to: string, banned: Set<number> = new Set()): Route | null {
  if (!HUBS[from] || !HUBS[to]) return null;
  const dist: Record<string, number> = {};
  const prev: Record<string, { n: string; i: number }> = {};
  const done = new Set<string>();
  for (const k in HUBS) dist[k] = Infinity;
  dist[from] = 0;
  for (;;) {
    let u: string | null = null;
    let best = Infinity;
    for (const k in dist) if (!done.has(k) && dist[k] < best) { best = dist[k]; u = k; }
    if (u === null || u === to) break;
    done.add(u);
    for (const e of ADJ[u] || []) {
      if (banned.has(e.i)) continue;
      const nd = dist[u] + e.km;
      if (nd < dist[e.to]) { dist[e.to] = nd; prev[e.to] = { n: u, i: e.i }; }
    }
  }
  if (dist[to] === Infinity) return null;
  const nodes = [to];
  const edges: number[] = [];
  let c = to;
  while (c !== from) { edges.unshift(prev[c].i); c = prev[c].n; nodes.unshift(c); }
  return { nodes, edges, km: dist[to] };
}

/** Best route plus a sensible alternative (no more than 35% longer), if there is one. */
export function routeBetween(a: string | null, b: string | null): { best: Route; alt: Route | null } | null {
  if (!a || !b || a === b) return null;
  const best = shortest(a, b);
  if (!best) return null;
  let alt: Route | null = null;
  for (const ei of best.edges) {
    const r = shortest(a, b, new Set([ei]));
    if (r && r.edges.join() !== best.edges.join() && (!alt || r.km < alt.km)) alt = r;
  }
  if (alt && alt.km > best.km * 1.35) alt = null;
  return { best, alt };
}

export function pathFromNodes(nodes: string[]): Route | null {
  const edges: number[] = [];
  let km = 0;
  for (let i = 0; i < nodes.length - 1; i++) {
    const e = (ADJ[nodes[i]] || []).find(x => x.to === nodes[i + 1]);
    if (!e) return null;
    edges.push(e.i);
    km += e.km;
  }
  return { nodes, edges, km };
}

export interface RouteInfo { pts: LatLon[]; keys: (string | null)[]; borders: string[]; ports: string[]; countries: string[] }

/** Expand a route into drawable points, border posts crossed, ports and countries. */
export function describe(route: Route): RouteInfo {
  const pts: LatLon[] = [];
  const keys: (string | null)[] = [];
  const borders: string[] = [];
  route.nodes.forEach((n, idx) => {
    if (idx === route.nodes.length - 1) return;
    const road = ROADS[route.edges[idx]];
    let seq: (string | LatLon)[] = [road.from, ...road.via, road.to];
    if (road.from !== n) seq = seq.reverse();
    seq.forEach((p, j) => {
      if (j === 0 && idx > 0) return;
      if (typeof p === 'string' && HUBS[p]) { pts.push(HUBS[p].ll); keys.push(p); }
      else if (typeof p === 'string' && BORDERS[p]) { pts.push(BORDERS[p].ll); keys.push(p); borders.push(p); }
      else if (typeof p !== 'string') { pts.push(p); keys.push(null); }
    });
  });
  const ports = route.nodes.filter(n => HUBS[n].port);
  const countries = [...new Set(route.nodes.map(n => HUBS[n].country).concat(borders.flatMap(b => BORDERS[b].pair)))];
  return { pts, keys, borders, ports, countries };
}

export const routeStops = (route: Route) => describe(route).keys.filter((k): k is string => !!k);

/* ---------- What the public site shows ---------- */
let saEdges: Set<number> | null = null;
function southAfricaEdges() {
  if (!saEdges) {
    saEdges = new Set();
    CORRIDORS.filter(c => c.group === 'sa').forEach(c => pathFromNodes(c.path)?.edges.forEach(e => saEdges!.add(e)));
  }
  return saEdges;
}
/** zm: inside Zambia, sa: South Africa (coming soon), reg: not shown on the public map. */
export function roadTier(i: number): 'zm' | 'sa' | 'reg' {
  const { from, to } = ROADS[i];
  if (HUBS[from].country === 'ZM' && HUBS[to].country === 'ZM') return 'zm';
  return southAfricaEdges().has(i) || (HUBS[from].region && HUBS[to].region) ? 'sa' : 'reg';
}
export function hubTier(k: string): 'zm' | 'sa' | 'reg' {
  if (HUBS[k].country === 'ZM') return 'zm';
  if (HUBS[k].region) return 'sa';
  for (const i of southAfricaEdges()) if (ROADS[i].from === k || ROADS[i].to === k) return 'sa';
  return 'reg';
}
/** Towns customers can pick: Zambia plus the South African towns that are coming soon. */
export const isPublicHub = (k: string) => hubTier(k) === 'zm' || (HUBS[k].country === 'ZA' && hubTier(k) === 'sa');
export const isComingSoon = (k: string) => !!HUBS[k] && HUBS[k].country !== 'ZM';

export const driveDays = (km: number) => Math.max(1, Math.ceil(km / 550));
export const daysText = (km: number, borders: number) =>
  `About ${driveDays(km)} driving ${driveDays(km) > 1 ? 'days' : 'day'}${borders ? ', plus border clearance' : ''}`;

/* ---------- Web Mercator projection matching map/countries.json ---------- */
const K = 1890.9498, TX = -379.538, TY = -138.65;
export const proj = ([lat, lon]: LatLon): [number, number] => {
  const l = (lon * Math.PI) / 180, p = (lat * Math.PI) / 180;
  return [TX + K * l, TY - K * Math.log(Math.tan(Math.PI / 4 + p / 2))];
};
