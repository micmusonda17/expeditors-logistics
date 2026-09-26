import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { BORDERS } from '../lib/network';
import { ago, money } from '../lib/format';
import { createMap, type SouthernMap } from '../map/SouthernMap';
import { statusClass, useAdmin } from './AdminContext';
import { laneOf } from './shared';

const DAY = 864e5;
const t = (iso: string) => new Date(iso).getTime();

function Kpi({ k, v, sub, tone = '' }: { k: string; v: ReactNode; sub: string; tone?: string }) {
  return <div className={'kpi ' + tone}><div className="kpi-k">{k}</div><div className="kpi-v num">{v}</div><div className="kpi-s">{sub}</div></div>;
}

export function Dashboard() {
  const { quotes, loads, openQuote, openLoad } = useAdmin();
  const now = Date.now();
  const month = new Date(); month.setDate(1); month.setHours(0, 0, 0, 0);
  const active = useMemo(() => loads.filter(l => l.status !== 'Delivered'), [loads]);
  const atBorder = active.filter(l => l.status === 'At border');
  const delivered30 = loads.filter(l => l.status === 'Delivered' && t(l.updatedAt) > now - 30 * DAY);
  const newQ = quotes.filter(q => q.status === 'new');
  const qMonth = quotes.filter(q => t(q.createdAt) >= month.getTime());
  const won = quotes.filter(q => q.status === 'won').length, lost = quotes.filter(q => q.status === 'lost').length;
  const booked: Record<string, number> = {};
  loads.filter(l => t(l.createdAt) >= month.getTime() && l.rate).forEach(l => { booked[l.currency] = (booked[l.currency] || 0) + (l.rate || 0); });
  const bookedTxt = Object.entries(booked).map(([c, v]) => money(v, c)).join(' · ') || '-';
  const stale = active.filter(l => t(l.updatedAt) < now - DAY);
  const feed = [
    ...loads.flatMap(l => l.events.map(e => ({ t: t(e.createdAt), key: `l${l.ref}${e.createdAt}`, open: () => openLoad(l.ref), node: <><b className="mono">{l.ref}</b> <span className={'pill ' + statusClass(e.status)}>{e.status}</span> {e.location}</> }))),
    ...quotes.map(q => ({ t: t(q.createdAt), key: `q${q.id}`, open: () => openQuote(q.id), node: <><b>New quote</b> from {q.name} · {laneOf(q)}</> }))
  ].sort((a, b) => b.t - a.t).slice(0, 9);

  const svgRef = useRef<SVGSVGElement>(null);
  const mapRef = useRef<SouthernMap | null>(null);
  useEffect(() => {
    const m = createMap(svgRef.current!, { unitBoost: 1.1, local: true, onPin: refs => (refs.length === 1 ? openLoad(refs[0]) : (location.hash = '#admin-loads')) });
    m.view([[-26.9, 21.6], [-8.2, 33.9]], { animate: false });
    mapRef.current = m;
    return () => m.destroy();
  }, [openLoad]);
  useEffect(() => {
    mapRef.current?.setPins(active.filter(l => l.at).map(l => ({ at: l.at, ref: l.ref, label: l.ref, status: l.status, title: `${l.status}, ${l.location}` })));
  }, [active]);

  return (
    <>
      <div className="kpis">
        <Kpi k="New quotes" v={newQ.length} sub={newQ.length ? `oldest ${ago(Math.min(...newQ.map(q => t(q.createdAt))))}` : 'inbox clear'} tone={newQ.length ? 'hot' : ''} />
        <Kpi k="Active loads" v={active.length} sub={`${active.filter(l => l.status === 'In transit').length} in transit`} />
        <Kpi k="At a border" v={atBorder.length} sub={atBorder.map(l => BORDERS[l.at]?.name || l.location).filter(Boolean).slice(0, 2).join(', ') || 'none'} tone={atBorder.length ? 'warn' : ''} />
        <Kpi k="Delivered" v={delivered30.length} sub="last 30 days" tone="ok" />
        <Kpi k="Quotes this month" v={qMonth.length} sub={won + lost ? `${Math.round((won / (won + lost)) * 100)}% won` : 'no decisions yet'} />
        <Kpi k="Booked this month" v={<span className="kpi-money">{bookedTxt}</span>} sub="from new loads" />
      </div>
      <div className="dash-grid">
        <section className="card map-card">
          <div className="card-head"><h2>Trucks on the road</h2><span className="muted">{active.length} active {active.length === 1 ? 'load' : 'loads'}</span></div>
          <div className="dash-map"><svg ref={svgRef} aria-label="Map of active loads" /></div>
          <div className="legend dark">
            <span><i className="lg-route" style={{ background: '#FF5A4F', width: 10, height: 10, borderRadius: '50%' }} />On the road</span>
            <span><i style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--amber)', display: 'inline-block' }} />At a border</span>
          </div>
        </section>
        <div className="dash-side">
          <section className="card">
            <div className="card-head"><h2>Needs attention</h2></div>
            <ul className="attn">
              {newQ.slice().reverse().slice(0, 4).map(q => (
                <li key={'q' + q.id}><button type="button" onClick={() => openQuote(q.id)}><span className="pill st-new">Quote</span><span className="attn-main"><b>{q.name}</b><small>{laneOf(q)} · {ago(q.createdAt)}</small></span></button></li>
              ))}
              {stale.slice(0, 3).map(l => (
                <li key={'s' + l.ref}><button type="button" onClick={() => openLoad(l.ref)}><span className="pill st-stale">No update</span><span className="attn-main"><b className="mono">{l.ref}</b><small>{laneOf(l)} · last update {ago(l.updatedAt)}</small></span></button></li>
              ))}
              {atBorder.slice(0, 3).map(l => (
                <li key={'b' + l.ref}><button type="button" onClick={() => openLoad(l.ref)}><span className="pill st-at-border">Border</span><span className="attn-main"><b className="mono">{l.ref}</b><small>{l.location} · {ago(l.updatedAt)}</small></span></button></li>
              ))}
              {!newQ.length && !stale.length && !atBorder.length && <li className="empty">Nothing waiting. Good work.</li>}
            </ul>
          </section>
          <section className="card">
            <div className="card-head"><h2>Recent activity</h2></div>
            <ul className="feed">
              {feed.length ? feed.map(f => (
                <li key={f.key}><button type="button" onClick={f.open}><span className="feed-main">{f.node}</span><span className="feed-t">{ago(f.t)}</span></button></li>
              )) : <li className="empty">No activity yet.</li>}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
