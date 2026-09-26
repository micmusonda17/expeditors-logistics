import { useState } from 'react';
import { ago, fmt, money } from '../lib/format';
import { IconSearch } from '../components/Icons';
import { QUOTE_STATUS, statusClass, useAdmin } from './AdminContext';
import { laneOf } from './shared';

export function QuotesView() {
  const { quotes, openQuote } = useAdmin();
  const [filter, setFilter] = useState<'all' | 'new' | 'quoted' | 'won' | 'lost'>('new');
  const [search, setSearch] = useState('');
  const term = search.trim().toLowerCase();
  const list = quotes.filter(q => (filter === 'all' || q.status === filter) &&
    (!term || [q.ref, q.name, q.company, q.pickup, q.delivery, q.cargo, q.phone].join(' ').toLowerCase().includes(term)));
  const tabs: [typeof filter, string, number][] = [['all', 'All', quotes.length], ...QUOTE_STATUS.map(([k, n]) => [k, n, quotes.filter(q => q.status === k).length] as [typeof filter, string, number])];

  return (
    <>
      <div className="toolbar">
        <div className="tabs" role="tablist">
          {tabs.map(([k, n, c]) => <button key={k} type="button" role="tab" aria-selected={filter === k} onClick={() => setFilter(k)}>{n}<b>{c}</b></button>)}
        </div>
        <label className="search"><IconSearch /><span className="sr-only">Search quotes</span>
          <input type="search" placeholder="Search name, town, reference" value={search} onChange={e => setSearch(e.target.value)} /></label>
      </div>
      <div className="card table-card">
        {list.length ? (
          <table className="tbl">
            <thead><tr><th>Received</th><th>Customer</th><th>Lane</th><th>Cargo</th><th className="r">Rate</th><th>Status</th></tr></thead>
            <tbody>
              {list.map(q => (
                <tr key={q.id} tabIndex={0} onClick={() => openQuote(q.id)} onKeyDown={e => { if (e.key === 'Enter') openQuote(q.id); }}>
                  <td><span className="mono small">{q.ref}</span><small className="muted">{ago(q.createdAt)}</small></td>
                  <td><b>{q.name}</b><small className="muted">{q.company || q.phone}</small></td>
                  <td>{laneOf(q)}{q.km > 0 && <small className="muted num">≈{fmt(q.km)} km</small>}</td>
                  <td>{q.cargo}{q.weight ? <small className="muted">{q.weight} t · {q.truck}</small> : null}</td>
                  <td className="r num">{q.rate ? money(q.rate, q.currency) : <span className="muted">-</span>}</td>
                  <td><span className={'pill ' + statusClass(q.status)}>{QUOTE_STATUS.find(s => s[0] === q.status)?.[1] ?? q.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <h3>{quotes.length ? 'No quotes match' : 'No quote requests yet'}</h3>
            <p>{quotes.length ? 'Try another filter or search.' : 'Requests from the website quote form land here the moment they are sent.'}</p>
          </div>
        )}
      </div>
    </>
  );
}
