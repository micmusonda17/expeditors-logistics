import { useState } from 'react';
import { STAGES } from '../lib/network';
import { ago, fmtDay } from '../lib/format';
import { IconSearch } from '../components/Icons';
import { statusClass, useAdmin } from './AdminContext';
import { laneOf } from './shared';

export function LoadsView() {
  const { loads, openLoad } = useAdmin();
  const [filter, setFilter] = useState('active');
  const [search, setSearch] = useState('');
  const term = search.trim().toLowerCase();
  const matches = (k: string, status: string) => k === 'all' || (k === 'active' ? status !== 'Delivered' : status === k);
  const list = loads.filter(l => matches(filter, l.status) &&
    (!term || [l.ref, l.customer, l.origin, l.destination, l.driver, l.truckReg, l.location].join(' ').toLowerCase().includes(term)));
  const tabs = [['active', 'Active'], ...STAGES.map(s => [s, s]), ['all', 'All']];

  return (
    <>
      <div className="toolbar">
        <div className="tabs" role="tablist">
          {tabs.map(([k, n]) => <button key={k} type="button" role="tab" aria-selected={filter === k} onClick={() => setFilter(k)}>{n}<b>{loads.filter(l => matches(k, l.status)).length}</b></button>)}
        </div>
        <label className="search"><IconSearch /><span className="sr-only">Search loads</span>
          <input type="search" placeholder="Search reference, customer, driver" value={search} onChange={e => setSearch(e.target.value)} /></label>
      </div>
      {list.length ? (
        <div className="load-grid">
          {list.map(l => {
            const idx = Math.max(0, STAGES.indexOf(l.status as (typeof STAGES)[number]));
            return (
              <button key={l.ref} type="button" className="load-card" onClick={() => openLoad(l.ref)}>
                <span className="lc-top"><b className="mono">{l.ref}</b><span className={'pill ' + statusClass(l.status)}>{l.status}</span></span>
                <span className="lc-lane">{laneOf(l)}</span>
                <span className="lc-cust">{l.customer}</span>
                <span className="lc-bar" aria-hidden>{STAGES.map((s, i) => <i key={s} className={i <= idx ? 'on' : ''} />)}</span>
                <span className="lc-meta"><span>{l.location || '-'}</span><span>{ago(l.updatedAt)}</span></span>
                <span className="lc-meta"><span>{l.driver || 'No driver set'}{l.truckReg ? ' · ' + l.truckReg : ''}</span><span>{l.status === 'Delivered' ? 'Delivered' : 'ETA ' + fmtDay(l.eta)}</span></span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="card"><div className="empty-state">
          <h3>{loads.length ? 'No loads match' : 'No loads yet'}</h3>
          <p>{loads.length ? 'Try another filter or search.' : 'Create a load from a won quote, or with the New load button.'}</p>
        </div></div>
      )}
    </>
  );
}
