import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { api, type Load, type LoadPatch } from '../api';
import { BORDERS, HUBS, STAGES, hubName, placeName, routeBetween, routeStops, type Stage } from '../lib/network';
import { ago, fmtDateTime, fmtDay, toIntl, trackingLink } from '../lib/format';
import { copyText } from '../lib/clipboard';
import { createMap } from '../map/SouthernMap';
import { toast } from '../components/Toast';
import { IconLink, IconPhone, IconWhatsApp, IconX } from '../components/Icons';
import { TRUCKS, statusClass, useAdmin } from './AdminContext';
import { CurrencyOptions, laneOf, phoneCountry } from './shared';
import { driverMessage, statusMessage } from './messages';
import { firstName } from '../lib/format';
import { COMPANY } from '../config';

function RouteMap({ load }: { load: Load }) {
  const ref = useRef<SVGSVGElement>(null);
  const route = useMemo(() => routeBetween(load.fromHub, load.toHub)?.best ?? null, [load.fromHub, load.toHub]);
  useEffect(() => {
    if (!route) return;
    const m = createMap(ref.current!, { labels: 'route', aspect: 1.9, unitBoost: 1.35 });
    m.fit(route, 0.12);
    m.showRoute(route, { truckAt: load.at || null });
    return () => m.destroy();
  }, [route, load.at]);
  return route ? <div className="dr-map"><svg ref={ref} aria-label="Route map" /></div> : null;
}

type Details = Record<'customer' | 'customerPhone' | 'customerEmail' | 'cargo' | 'weight' | 'truckType' | 'truckReg' | 'driver' | 'driverPhone' | 'loadDate' | 'rate' | 'currency' | 'notes', string>;
const toDetails = (l: Load): Details => ({
  customer: l.customer, customerPhone: l.customerPhone, customerEmail: l.customerEmail, cargo: l.cargo,
  weight: l.weight == null ? '' : String(l.weight), truckType: l.truckType, truckReg: l.truckReg, driver: l.driver,
  driverPhone: l.driverPhone, loadDate: l.loadDate || '', rate: l.rate == null ? '' : String(l.rate), currency: l.currency, notes: l.notes
});

export function LoadDrawer({ load: l }: { load: Load }) {
  const { refresh, closeDrawer, message } = useAdmin();
  const route = useMemo(() => routeBetween(l.fromHub, l.toHub)?.best ?? null, [l.fromHub, l.toHub]);
  const stops = route ? routeStops(route) : [];
  const cc = phoneCountry(l.fromHub);
  const nextStage = STAGES[Math.min(STAGES.length - 1, Math.max(0, STAGES.indexOf(l.status as Stage)) + (l.status === 'Delivered' ? 0 : 1))];
  const [upd, setUpd] = useState({ status: nextStage, at: l.at || stops[0] || '', other: '', note: '', eta: l.eta || '' });
  const [det, setDet] = useState<Details>(() => toDetails(l));
  const [armed, setArmed] = useState(false);
  useEffect(() => { if (!armed) return; const t = setTimeout(() => setArmed(false), 4000); return () => clearTimeout(t); }, [armed]);

  const events = [...l.events].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const otherPlaces = [...Object.keys(HUBS), ...Object.keys(BORDERS)].filter(k => !stops.includes(k));

  async function postUpdate(e: FormEvent) {
    e.preventDefault();
    const other = upd.at === '__other';
    const location = other ? upd.other.trim() : placeName(upd.at);
    if (!location) { toast('Say where the truck is'); document.getElementById('u-other')?.focus(); return; }
    try {
      const fresh = await api.addEvent(l.ref, { status: upd.status as Stage, at: other ? '' : upd.at, location, note: upd.note.trim(), eta: upd.eta || null });
      toast('Update posted');
      await refresh();
      message({ to: fresh.customer, phone: toIntl(fresh.customerPhone, cc), text: statusMessage(fresh), title: 'Let the customer know?' });
    } catch (err) { toast(err instanceof Error ? err.message : 'Could not post the update. Check your connection.'); }
  }

  async function saveDetails(e: FormEvent) {
    e.preventDefault();
    const p: LoadPatch = { ...det, weight: det.weight ? +det.weight : null, rate: det.rate === '' ? null : +det.rate, loadDate: det.loadDate || null };
    try { await api.updateLoad(l.ref, p); await refresh(); toast('Details saved'); }
    catch (err) { toast(err instanceof Error ? err.message : 'Could not save. Check your connection.'); }
  }

  async function remove() {
    if (!armed) { setArmed(true); return; }
    try { await api.deleteLoad(l.ref); closeDrawer(); await refresh(); toast(`${l.ref} deleted`); }
    catch (err) { toast(err instanceof Error ? err.message : 'Could not delete'); }
  }

  const d = (k: keyof Details, label: string, type = 'text') => (
    <div className="field"><label htmlFor={'d-' + k}>{label}</label>
      <input id={'d-' + k} type={type} value={det[k]} onChange={e => setDet(s => ({ ...s, [k]: e.target.value }))} {...(type === 'number' ? { min: 0, step: 0.1 } : {})} /></div>
  );

  return (
    <>
      <div className="dr-head">
        <div><p className="dr-eyebrow mono">{l.ref} · booked {fmtDay(l.createdAt, true)}</p><h2 id="dr-title">{laneOf(l)}</h2><p className="muted">{l.customer}</p></div>
        <button className="icon-btn" type="button" data-close aria-label="Close" onClick={closeDrawer}><IconX /></button>
      </div>
      <RouteMap load={l} />
      <div className="dr-body">
        <div className="dr-status"><span className={'pill big ' + statusClass(l.status)}>{l.status}</span><span>{l.location}</span><span className="muted">{ago(l.updatedAt)}</span></div>
        <div className="btn-row">
          <button type="button" className="btn btn-wa btn-sm" onClick={() => message({ to: l.customer, phone: toIntl(l.customerPhone, cc), text: statusMessage(l) })}><IconWhatsApp />Send update to customer</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => copyText(trackingLink(l.ref))}><IconLink />Copy tracking link</button>
          <a className="btn btn-ghost btn-sm" href={`#track-${l.ref}`}>View as customer</a>
        </div>

        <section className="dr-sec">
          <h3>Post an update</h3>
          <form className="upd" onSubmit={postUpdate}>
            <div className="field"><label htmlFor="u-status">Stage</label>
              <select id="u-status" value={upd.status} onChange={e => setUpd(s => ({ ...s, status: e.target.value as Stage }))}>{STAGES.map(s => <option key={s}>{s}</option>)}</select></div>
            <div className="field"><label htmlFor="u-at">Where is the truck?</label>
              <select id="u-at" value={upd.at} onChange={e => setUpd(s => ({ ...s, at: e.target.value }))}>
                {stops.length > 0 && <optgroup label="On this route">{stops.map(k => <option key={k} value={k}>{placeName(k)}</option>)}</optgroup>}
                <optgroup label="Other places">{otherPlaces.map(k => <option key={k} value={k}>{placeName(k)}</option>)}</optgroup>
                <option value="__other">Somewhere else (type it)</option>
              </select></div>
            {upd.at === '__other' && <div className="field full"><label htmlFor="u-other">Location</label><input id="u-other" placeholder="e.g. 40 km past Kabwe" value={upd.other} onChange={e => setUpd(s => ({ ...s, other: e.target.value }))} /></div>}
            <div className="field full"><label htmlFor="u-note">Note for the customer</label><input id="u-note" placeholder="e.g. On schedule, reefer at 2°C" value={upd.note} onChange={e => setUpd(s => ({ ...s, note: e.target.value }))} /></div>
            <div className="field"><label htmlFor="u-eta">Estimated delivery</label><input id="u-eta" type="date" value={upd.eta} onChange={e => setUpd(s => ({ ...s, eta: e.target.value }))} /></div>
            <div className="field upd-go"><button className="btn btn-red" type="submit">Post update</button></div>
          </form>
        </section>

        <section className="dr-sec">
          <h3>Timeline</h3>
          <ol className="timeline">
            {events.map((e, i) => (
              <li key={i}><div className="tl-top"><span className="tl-st">{e.status}</span><span className="tl-loc">{e.location}</span><span className="tl-t">{fmtDateTime(e.createdAt)}</span></div>{e.note && <div className="tl-note">{e.note}</div>}</li>
            ))}
          </ol>
        </section>

        <section className="dr-sec">
          <h3>People</h3>
          <div className="people">
            <div><span className="k">Customer</span><b>{l.customer || '-'}</b><span className="mono small">{l.customerPhone}</span>
              {l.customerPhone && <div className="btn-row">
                <button type="button" className="btn btn-wa btn-sm" onClick={() => message({ to: l.customer, phone: toIntl(l.customerPhone, cc), text: `Hello ${firstName(l.customer)}, this is ${COMPANY.shortName} about load ${l.ref}.` })}><IconWhatsApp />WhatsApp</button>
                <a className="btn btn-ghost btn-sm" href={`tel:+${toIntl(l.customerPhone, cc)}`}><IconPhone />Call</a></div>}</div>
            <div><span className="k">Driver</span><b>{l.driver || '-'}</b><span className="mono small">{l.driverPhone}</span>
              {l.driverPhone && <div className="btn-row">
                <button type="button" className="btn btn-wa btn-sm" onClick={() => message({ to: l.driver, phone: toIntl(l.driverPhone, 'ZM'), text: driverMessage(l) })}><IconWhatsApp />Send load details</button>
                <a className="btn btn-ghost btn-sm" href={`tel:+${toIntl(l.driverPhone, 'ZM')}`}><IconPhone />Call</a></div>}</div>
          </div>
        </section>

        <section className="dr-sec">
          <h3>Load details</h3>
          <form className="det" onSubmit={saveDetails}>
            {d('customer', 'Customer')}{d('customerPhone', 'Customer phone', 'tel')}
            {d('customerEmail', 'Customer email', 'email')}{d('cargo', 'Cargo')}
            {d('weight', 'Weight (t)', 'number')}
            <div className="field"><label htmlFor="d-truckType">Truck type</label>
              <select id="d-truckType" value={det.truckType} onChange={e => setDet(s => ({ ...s, truckType: e.target.value }))}><option value="">-</option>{TRUCKS.map(t => <option key={t}>{t}</option>)}</select></div>
            {d('truckReg', 'Truck reg')}{d('driver', 'Driver')}
            {d('driverPhone', 'Driver phone', 'tel')}{d('loadDate', 'Loading date', 'date')}
            <div className="field"><label htmlFor="d-rate">Rate</label><div className="rate-row">
              <select aria-label="Currency" value={det.currency} onChange={e => setDet(s => ({ ...s, currency: e.target.value }))}><CurrencyOptions /></select>
              <input id="d-rate" type="number" min={0} step={50} value={det.rate} onChange={e => setDet(s => ({ ...s, rate: e.target.value }))} /></div></div>
            <div className="field full"><label htmlFor="d-notes">Internal notes</label><textarea id="d-notes" value={det.notes} onChange={e => setDet(s => ({ ...s, notes: e.target.value }))} /></div>
            <div className="field full btn-row">
              <button className="btn btn-sm" type="submit">Save details</button>
              <button className={'btn btn-ghost btn-sm danger' + (armed ? ' armed' : '')} type="button" onClick={remove}>{armed ? 'Tap again to delete' : 'Delete load'}</button>
            </div>
          </form>
        </section>
        <p className="muted small">{hubName(l.fromHub)} to {hubName(l.toHub)}</p>
      </div>
    </>
  );
}
