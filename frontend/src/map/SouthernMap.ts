/*
 * Interactive SVG map of Southern Africa.
 * Framework-free on purpose: React components create one with createMap() and call its methods.
 */
import countries from './countries.json';
import { BORDERS, HUBS, ROADS, describe, hubTier, proj, roadTier, type LatLon, type Route } from '../lib/network';
import { reduceMotion } from '../lib/format';

const NS = 'http://www.w3.org/2000/svg';
type Attrs = Record<string, string | number>;
const el = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Attrs = {}, parent?: Element) => {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  if (parent) parent.appendChild(e);
  return e;
};

const HOME = '894'; // Zambia
const NEXT = '710'; // South Africa
const REGION = new Set(['894', '716', '072', '516', '710', '426', '748', '508', '454', '834', '180', '024']);
// [text, x, y, kind] kind: 1 home country, 2 next country, 3 province
const COUNTRY_LABELS: [string, number, number, number?][] = [
  ['LIMPOPO', 551, 641, 3], ['ZAMBIA', 455, 360, 1], ['ZIMBABWE', 640, 525], ['BOTSWANA', 400, 640],
  ['NAMIBIA', 205, 705], ['SOUTH AFRICA', 400, 960, 2], ['MOZAMBIQUE', 805, 420], ['MALAWI', 762, 300],
  ['TANZANIA', 820, 190], ['DR CONGO', 330, 110], ['ANGOLA', 170, 280]
];
const toD = (pts: LatLon[]) => 'M' + pts.map(p => proj(p).map(v => v.toFixed(1)).join(',')).join('L');

interface CountryShape { id: string; d: string }
const MAP = countries as unknown as { W: number; H: number; countries: CountryShape[] };

export interface Pin { at: string; ref: string; label: string; status: string; title?: string }
export interface MapOptions {
  /** 'all' labels every town, 'route' only towns on the shown route */
  labels?: 'all' | 'route';
  countryLabels?: boolean;
  /** width / height of the viewBox when zooming */
  aspect?: number;
  unitBoost?: number;
  /** Public site: hide regional roads and towns that are not on offer */
  local?: boolean;
  /** Towns and countries can be clicked */
  interactive?: boolean;
  onHub?: (key: string) => void;
  onCountry?: (id: string) => void;
  onPin?: (refs: string[]) => void;
}

export interface SouthernMap {
  showRoute(route: Route | null, o?: { animate?: boolean; truckAt?: string | null }): void;
  focus(route: Route, o?: { pad?: number; animate?: boolean }): void;
  view(box: [LatLon, LatLon] | null, o?: { animate?: boolean; pad?: number }): void;
  fit(route: Route | null, pad?: number): void;
  setPins(pins: Pin[]): void;
  destroy(): void;
}

export function createMap(svg: SVGSVGElement, opts: MapOptions = {}): SouthernMap {
  const o: MapOptions = { labels: 'all', countryLabels: true, ...opts };
  svg.setAttribute('viewBox', `0 0 ${MAP.W} ${MAP.H}`);
  svg.classList.add('smap');
  if (o.interactive) svg.classList.add('interactive');
  svg.innerHTML = '';
  const layers = ['countries', 'clabels', 'roads', 'done', 'route', 'bps', 'hubs', 'pins', 'labels', 'truck'] as const;
  const g = Object.fromEntries(layers.map(k => [k, el('g', { class: 'g-' + k }, svg)])) as Record<(typeof layers)[number], SVGGElement>;

  MAP.countries.forEach(c => el('path', {
    d: c.d, 'data-id': c.id,
    class: 'country' + (c.id === HOME ? ' home' : c.id === NEXT ? ' next' : REGION.has(c.id) ? '' : ' far')
  }, g.countries));
  ROADS.forEach((r, i) => {
    const tier = roadTier(i);
    if (o.local && tier === 'reg') return;
    el('path', { d: toD(describe({ nodes: [r.from, r.to], edges: [i], km: r.km }).pts), class: 'road ' + tier }, g.roads);
  });

  let vb: [number, number, number, number] = [0, 0, MAP.W, MAP.H];
  const state: { route: Route | null; truckAt: string | null; animate: boolean; pins: Pin[] } = { route: null, truckAt: null, animate: false, pins: [] };
  let anim: number | null = null;
  let tween: number | null = null;
  let visible = true;
  let resume: (() => void) | null = null;

  const unit = () => {
    const w = svg.clientWidth || 600;
    return (vb[2] / 1000) * Math.max(1, 780 / w) * (o.unitBoost || 1);
  };

  function drawStatic() {
    const u = unit();
    g.clabels.innerHTML = ''; g.bps.innerHTML = ''; g.hubs.innerHTML = ''; g.labels.innerHTML = '';
    if (o.countryLabels) COUNTRY_LABELS.forEach(([t, x, y, kind]) => {
      if (kind === 3 && (!o.local || vb[2] > 700)) return;
      const e = el('text', {
        x, y,
        class: 'clabel' + (kind === 1 ? ' home' : kind === 2 ? ' next' : kind === 3 ? ' prov' : ''),
        'font-size': (kind === 3 ? 12 : kind ? 18 : 15) * u * (vb[2] < 1000 ? 1.3 : 1)
      }, g.clabels);
      e.textContent = t;
    });
    const onRoute = new Set<string>();
    let info = null;
    if (state.route) { info = describe(state.route); info.keys.forEach(k => k && onRoute.add(k)); }

    for (const k in BORDERS) {
      if (o.local && !onRoute.has(k)) continue;
      const [x, y] = proj(BORDERS[k].ll), s = 5 * u * (onRoute.has(k) ? 1.25 : 1);
      el('rect', { x: x - s, y: y - s, width: s * 2, height: s * 2, class: 'bp' + (onRoute.has(k) ? ' on' : ''), transform: `rotate(45 ${x} ${y})`, 'stroke-width': 1.5 * u }, g.bps);
    }
    for (const k in HUBS) {
      const h = HUBS[k], [x, y] = proj(h.ll), on = onRoute.has(k);
      const reg = o.local ? hubTier(k) !== 'zm' && !(h.country === 'ZA' && hubTier(k) === 'sa') : h.country !== 'ZM' && h.country !== 'ZA';
      if (o.local && hubTier(k) === 'reg' && !on) continue;
      el('circle', { cx: x, cy: y, r: (h.minor ? 4.5 : h.port ? 7 : 6.5) * u, class: 'hub' + (h.port ? ' port' : '') + (reg && !on ? ' reg' : '') + (on ? ' on' : ''), 'stroke-width': (on ? 3 : 2) * u }, g.hubs);
      if (o.interactive) {
        const hit = el('circle', { cx: x, cy: y, r: 15 * u, class: 'hit', 'data-h': k, tabindex: 0, role: 'button', 'aria-label': `Show the route to ${h.name}` }, g.hubs);
        el('title', {}, hit).textContent = h.name;
      }
      if (o.labels === 'route' && !on) continue;
      if ((h.minor || h.small) && !on && (u * 1000) / vb[2] > 1.3 && vb[2] > 700) continue;
      if (h.zoom === 1 && !on && vb[2] > 700) continue;
      if (h.zoom === 2 && !on && vb[2] > 320) continue;
      const off = 12 * u;
      const pos = ({ r: [x + off, y + 5 * u, 'start'], l: [x - off, y + 5 * u, 'end'], t: [x, y - 12 * u, 'middle'], b: [x, y + 24 * u, 'middle'], rb: [x + off, y + 20 * u, 'start'] } as const)[h.label || 'r'];
      const t = el('text', { x: pos[0], y: pos[1], 'text-anchor': pos[2], class: 'hlabel' + (h.minor ? ' minor' : '') + (reg && !on ? ' reg' : '') + (on ? ' on' : ''), 'font-size': (h.minor ? 14 : 17) * u, 'stroke-width': 5 * u }, g.labels);
      t.textContent = h.name;
    }
    if (info) info.borders.forEach(b => {
      const [x, y] = proj(BORDERS[b].ll);
      const oo = ({ r: [x + 11 * u, y + 5 * u, 'start'], rb: [x + 8 * u, y + 22 * u, 'start'], b: [x, y + 24 * u, 'middle'], t: [x, y - 12 * u, 'middle'], l: [x - 11 * u, y + 5 * u, 'end'] } as const)[BORDERS[b].label || 'r'];
      const t = el('text', { x: oo[0], y: oo[1], 'text-anchor': oo[2], class: 'blabel', 'font-size': 13 * u, 'stroke-width': 5 * u }, g.labels);
      t.textContent = BORDERS[b].name;
    });

    // Pins (dashboard): trucks at a place
    g.pins.innerHTML = '';
    const byPlace: Record<string, Pin[]> = {};
    state.pins.forEach(p => { if (HUBS[p.at] || BORDERS[p.at]) (byPlace[p.at] ||= []).push(p); });
    Object.entries(byPlace).forEach(([k, list]) => {
      const [x, y] = proj((HUBS[k] || BORDERS[k]).ll);
      const grp = el('g', { class: 'pin' + (list.some(p => p.status === 'At border') ? ' border' : ''), 'data-refs': list.map(p => p.ref).join(','), tabindex: 0, role: 'button', 'aria-label': list.map(p => `${p.label} at ${p.title || ''}`).join('; ') }, g.pins);
      el('circle', { cx: x, cy: y, r: 11 * u, class: 'pin-halo' }, grp);
      el('circle', { cx: x, cy: y, r: 7 * u, class: 'pin-dot', 'stroke-width': 3 * u }, grp);
      const label = list.length > 1 ? `${list.length} loads` : list[0].label;
      const w = (label.length * 8.2 + 16) * u, hgt = 22 * u;
      el('rect', { x: x + 12 * u, y: y - hgt - 4 * u, width: w, height: hgt, rx: 5 * u, class: 'pin-tag' }, grp);
      const t = el('text', { x: x + 20 * u, y: y - 11 * u, class: 'pin-text', 'font-size': 13 * u }, grp);
      t.textContent = label;
      el('title', {}, grp).textContent = list.map(p => `${p.label}: ${p.title || ''}`).join('\n');
    });
  }

  function stopAnim() { if (anim) { cancelAnimationFrame(anim); anim = null; } resume = null; }

  function drawRoute() {
    g.route.innerHTML = ''; g.done.innerHTML = ''; g.truck.innerHTML = '';
    stopAnim();
    if (!state.route) return;
    const u = unit();
    const info = describe(state.route);
    const d = toD(info.pts);
    let atIdx: number | null = state.truckAt ? info.keys.indexOf(state.truckAt) : -1;
    if (state.truckAt && atIdx < 0) atIdx = null;
    el('path', { d, class: 'route-glow', 'stroke-width': 14 * u }, g.route);
    const ahead = atIdx !== -1 && atIdx !== null;
    const path = el('path', { d, class: 'route' + (ahead ? ' ahead' : ''), 'stroke-width': 4.5 * u, ...(ahead ? { 'stroke-dasharray': `${2 * u} ${10 * u}` } : {}) }, g.route);
    if (atIdx !== null && atIdx > 0) el('path', { d: toD(info.pts.slice(0, atIdx + 1)), class: 'route', 'stroke-width': 5 * u }, g.done);
    const len = path.getTotalLength();
    const pulse = el('circle', { r: 9 * u, class: 'truck-pulse', 'stroke-width': 2 * u }, g.truck);
    const dot = el('circle', { r: 9 * u, class: 'truck-dot', 'stroke-width': 4 * u }, g.truck);
    const put = (x: number, y: number) => [dot, pulse].forEach(c => { c.setAttribute('cx', String(x)); c.setAttribute('cy', String(y)); });
    if (state.truckAt) {
      const ll = (HUBS[state.truckAt] || BORDERS[state.truckAt])?.ll;
      if (ll) { const [x, y] = proj(ll); put(x, y); } else g.truck.innerHTML = '';
      return;
    }
    if (!state.animate || reduceMotion()) { const p = path.getPointAtLength(len); put(p.x, p.y); return; }
    path.style.strokeDasharray = String(len);
    path.style.strokeDashoffset = String(len);
    path.getBoundingClientRect();
    path.classList.add('draw');
    path.style.strokeDashoffset = '0';
    path.addEventListener('transitionend', () => { path.style.strokeDasharray = ''; }, { once: true });
    const dur = Math.max(5000, len * 9), t0 = performance.now() + 1300;
    const tick = (now: number) => {
      const t = Math.max(0, now - t0) % (dur + 1400);
      const p = path.getPointAtLength(Math.min(1, t / dur) * len);
      put(p.x, p.y);
      anim = visible ? requestAnimationFrame(tick) : null;
    };
    const p0 = path.getPointAtLength(0); put(p0.x, p0.y);
    anim = requestAnimationFrame(tick);
    resume = () => { if (!anim) anim = requestAnimationFrame(tick); };
  }

  const redraw = () => { drawStatic(); drawRoute(); };
  const setVB = (v: [number, number, number, number]) => { vb = v; svg.setAttribute('viewBox', vb.map(n => n.toFixed(1)).join(' ')); };

  function boundsVB(pts: [number, number][], pad: number): [number, number, number, number] {
    let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
    pts.forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); });
    let w = x1 - x0, h = y1 - y0;
    const ratio = o.aspect || 1.6;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    w = Math.max(w * (1 + pad * 2), 260); h = Math.max(h * (1 + pad * 2), 160);
    if (w / h < ratio) w = h * ratio; else h = w / ratio;
    return [cx - w / 2, cy - h / 2, w, h];
  }

  function goTo(target: [number, number, number, number], animate: boolean) {
    if (tween) { cancelAnimationFrame(tween); tween = null; }
    if (!animate || reduceMotion()) { setVB(target); redraw(); return; }
    const from = vb.slice() as typeof vb, t0 = performance.now(), dur = 650;
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    g.route.innerHTML = ''; g.done.innerHTML = ''; g.truck.innerHTML = '';
    stopAnim();
    const step = (now: number) => {
      const k = ease(Math.min(1, (now - t0) / dur));
      setVB(from.map((v, i) => v + (target[i] - v) * k) as typeof vb);
      if (k < 1) tween = requestAnimationFrame(step); else { tween = null; redraw(); }
    };
    tween = requestAnimationFrame(step);
  }

  // Events
  const onClick = (e: MouseEvent) => {
    const t = e.target as Element;
    const pin = t.closest('.pin') as SVGGElement | null;
    if (pin && o.onPin) return o.onPin(pin.dataset.refs!.split(','));
    const hit = t.closest('.hit') as SVGCircleElement | null;
    if (hit && o.onHub) return o.onHub(hit.dataset.h!);
    const c = t.closest('.country[data-id]') as SVGPathElement | null;
    if (c && o.onCountry) o.onCountry(c.dataset.id!);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const t = e.target as Element;
    const hit = t.closest?.('.hit') as SVGCircleElement | null;
    const pin = t.closest?.('.pin') as SVGGElement | null;
    if (hit && o.onHub) { e.preventDefault(); o.onHub(hit.dataset.h!); }
    else if (pin && o.onPin) { e.preventDefault(); o.onPin(pin.dataset.refs!.split(',')); }
  };
  svg.addEventListener('click', onClick);
  svg.addEventListener('keydown', onKey);

  let ro: ResizeObserver | null = null;
  if ('ResizeObserver' in window) {
    let lastW = 0;
    ro = new ResizeObserver(() => { const w = svg.clientWidth; if (Math.abs(w - lastW) > 40) { lastW = w; redraw(); } });
    ro.observe(svg);
  }
  let io: IntersectionObserver | null = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible && resume) resume(); });
    io.observe(svg);
  }
  drawStatic();

  return {
    showRoute(route, { animate = false, truckAt = null } = {}) {
      state.route = route; state.animate = animate; state.truckAt = truckAt;
      redraw();
    },
    focus(route, { pad = 0.16, animate = true } = {}) {
      state.route = route; state.animate = animate; state.truckAt = null;
      goTo(boundsVB(describe(route).pts.map(proj), pad), animate);
    },
    view(box, { animate = true, pad = 0.04 } = {}) {
      goTo(box ? boundsVB([proj(box[0]), proj(box[1])], pad) : [0, 0, MAP.W, MAP.H], animate);
    },
    fit(route, pad = 0.18) {
      if (!route) setVB([0, 0, MAP.W, MAP.H]);
      else setVB(boundsVB(describe(route).pts.map(proj), pad));
      redraw();
    },
    setPins(pins) { state.pins = pins || []; drawStatic(); },
    destroy() {
      stopAnim();
      if (tween) cancelAnimationFrame(tween);
      ro?.disconnect(); io?.disconnect();
      svg.removeEventListener('click', onClick);
      svg.removeEventListener('keydown', onKey);
    }
  };
}
