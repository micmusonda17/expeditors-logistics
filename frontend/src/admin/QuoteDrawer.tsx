import { useState } from 'react';
import { api, type Quote } from '../api';
import { COMPANY } from '../config';
import { describe, matchHub, routeBetween } from '../lib/network';
import { fmt, fmtDateTime, fmtDay, toIntl } from '../lib/format';
import { copyText } from '../lib/clipboard';
import { toast } from '../components/Toast';
import { BorderChips } from '../components/BorderChips';
import { IconCopy, IconMail, IconPhone, IconTruck, IconWhatsApp, IconX } from '../components/Icons';
import { QUOTE_STATUS, TRUCKS, statusClass, useAdmin } from './AdminContext';
import { CurrencyOptions, phoneCountry } from './shared';
import { rateMessage } from './messages';
import { firstName } from '../lib/format';

export function QuoteDrawer({ quote: q }: { quote: Quote }) {
  const { refresh, closeDrawer, openLoad, openNewLoad, message } = useAdmin();
  const [rate, setRate] = useState(q.rate != null ? String(q.rate) : '');
  const [currency, setCurrency] = useState(q.currency || COMPANY.currencies[0]);
  const [notes, setNotes] = useState(q.internalNotes);
  const r = q.fromHub && q.toHub ? routeBetween(q.fromHub, q.toHub) : null;
  const info = r ? describe(r.best) : null;
  const cc = phoneCountry(q.fromHub);
  const phone = toIntl(q.phone, cc);

  const patch = async (p: Parameters<typeof api.updateQuote>[1], msg?: string) => {
    try { await api.updateQuote(q.id, p); await refresh(); if (msg) toast(msg); }
    catch (e) { toast(e instanceof Error ? e.message : 'Could not save'); }
  };
  const saveRate = async (silent = false) => {
    const amount = rate === '' ? null : +rate;
    await patch({ rate: amount, currency, ...(amount && q.status === 'new' ? { status: 'quoted' as const } : {}) }, silent ? undefined : 'Rate saved');
    return amount;
  };
  const sendRate = async (via: 'wa' | 'mail') => {
    if (!rate) { toast('Enter the rate first'); document.getElementById('dq-rate')?.focus(); return; }
    const amount = await saveRate(true);
    const text = rateMessage(q, amount!, currency);
    if (via === 'wa') message({ to: q.name, phone, text });
    else location.href = `mailto:${q.email}?subject=${encodeURIComponent(`Your quote ${q.ref}: ${q.pickup} to ${q.delivery}`)}&body=${encodeURIComponent(text)}`;
  };

  return (
    <>
      <div className="dr-head">
        <div><p className="dr-eyebrow mono">{q.ref} · {fmtDateTime(q.createdAt)}</p><h2 id="dr-title">{q.name}</h2><p className="muted">{q.company}</p></div>
        <button className="icon-btn" type="button" data-close aria-label="Close" onClick={closeDrawer}><IconX /></button>
      </div>
      <div className="dr-body">
        <div className="seg" role="radiogroup" aria-label="Quote status">
          {QUOTE_STATUS.map(([k, n]) => (
            <button key={k} type="button" role="radio" aria-checked={q.status === k} className={statusClass(k)} onClick={() => patch({ status: k }, `Marked ${n.toLowerCase()}`)}>{n}</button>
          ))}
        </div>

        <section className="dr-sec">
          <h3>Customer</h3>
          <dl className="kv"><dt>Phone</dt><dd className="mono">{q.phone}</dd>{q.email && <><dt>Email</dt><dd>{q.email}</dd></>}</dl>
          <div className="btn-row">
            <button type="button" className="btn btn-wa btn-sm" onClick={() => message({ to: q.name, phone, text: `Hello ${firstName(q.name)}, this is ${COMPANY.shortName} about your quote request ${q.ref} (${q.pickup} to ${q.delivery}).` })}><IconWhatsApp />WhatsApp</button>
            <a className="btn btn-ghost btn-sm" href={`tel:+${phone}`}><IconPhone />Call</a>
            {q.email && <a className="btn btn-ghost btn-sm" href={`mailto:${q.email}?subject=${encodeURIComponent('Your quote ' + q.ref)}`}><IconMail />Email</a>}
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => copyText(q.phone)}><IconCopy />Copy number</button>
          </div>
        </section>

        <section className="dr-sec">
          <h3>Load</h3>
          <div className="lane-big"><span>{q.pickup}</span><span className="arr">→</span><span>{q.delivery}</span></div>
          {r && info ? (
            <>
              <p className="muted num">≈{fmt(r.best.km)} km{info.borders.length ? ` · ${info.borders.length} border ${info.borders.length > 1 ? 'posts' : 'post'}` : ''}</p>
              <div className="chips"><BorderChips borders={info.borders} /></div>
            </>
          ) : <p className="muted">Town not in the route planner, route manually.</p>}
          <dl className="kv">
            <dt>Service</dt><dd>{q.service}</dd><dt>Cargo</dt><dd>{q.cargo}</dd><dt>Weight</dt><dd>{q.weight ? `${q.weight} t` : '-'}</dd>
            <dt>Truck</dt><dd>{q.truck || '-'}</dd><dt>Loading date</dt><dd>{q.loadDate ? fmtDay(q.loadDate, true) : '-'}</dd>
          </dl>
          {q.notes && <p className="note-box">{q.notes}</p>}
        </section>

        <section className="dr-sec">
          <h3>Rate</h3>
          <div className="rate-row">
            <label className="sr-only" htmlFor="dq-cur">Currency</label>
            <select id="dq-cur" value={currency} onChange={e => setCurrency(e.target.value)}><CurrencyOptions /></select>
            <label className="sr-only" htmlFor="dq-rate">Rate</label>
            <input id="dq-rate" type="number" inputMode="decimal" min={0} step={50} placeholder={/hire/i.test(q.service) ? 'Rate per day' : 'Rate per load'} value={rate} onChange={e => setRate(e.target.value)} />
            <button type="button" className="btn btn-sm" onClick={() => saveRate()}>Save</button>
          </div>
          <div className="btn-row">
            <button type="button" className="btn btn-wa btn-sm" onClick={() => sendRate('wa')}><IconWhatsApp />Send rate on WhatsApp</button>
            {q.email && <button type="button" className="btn btn-ghost btn-sm" onClick={() => sendRate('mail')}><IconMail />Email rate</button>}
          </div>
        </section>

        <section className="dr-sec">
          <h3><label htmlFor="dq-notes">Internal notes</label></h3>
          <textarea id="dq-notes" placeholder="Only the team sees this" value={notes} onChange={e => setNotes(e.target.value)}
            onBlur={() => { if (notes !== q.internalNotes) patch({ internalNotes: notes }, 'Notes saved'); }} />
        </section>

        <div className="dr-foot">
          {q.loadRef
            ? <button type="button" className="btn btn-sm" onClick={() => openLoad(q.loadRef!)}><IconTruck />Open load {q.loadRef}</button>
            : <button type="button" className="btn btn-red btn-sm" onClick={() => openNewLoad({
                customer: q.company || q.name, customerPhone: q.phone, customerEmail: q.email,
                fromHub: q.fromHub || matchHub(q.pickup) || '', toHub: q.toHub || matchHub(q.delivery) || '',
                cargo: q.cargo, weight: q.weight, truckType: TRUCKS.includes(q.truck) ? q.truck : '',
                rate: rate === '' ? q.rate : +rate, currency, loadDate: q.loadDate, notes: q.notes, quoteId: q.id
              })}><IconTruck />Create load from this quote</button>}
        </div>
      </div>
    </>
  );
}
