import { useMemo, useState, type FormEvent } from 'react';
import { api, type LoadInput } from '../api';
import { COMPANY } from '../config';
import { describe, driveDays, routeBetween } from '../lib/network';
import { addDaysISO, fmt, todayISO, toIntl } from '../lib/format';
import { toast } from '../components/Toast';
import { BorderChips } from '../components/BorderChips';
import { IconPlus, IconX } from '../components/Icons';
import { TRUCKS, useAdmin } from './AdminContext';
import { CurrencyOptions, HubOptions, phoneCountry } from './shared';
import { bookingMessage } from './messages';

type F = Record<'fromHub' | 'toHub' | 'customer' | 'customerPhone' | 'customerEmail' | 'cargo' | 'weight' | 'truckType' | 'truckReg' | 'driver' | 'driverPhone' | 'loadDate' | 'eta' | 'rate' | 'currency' | 'notes', string>;

export function NewLoadDrawer({ prefill = {} }: { prefill?: Partial<LoadInput> }) {
  const { refresh, closeDrawer, openLoad, message } = useAdmin();
  const s = (v: unknown) => (v == null ? '' : String(v));
  const [f, setF] = useState<F>({
    fromHub: prefill.fromHub || 'lusaka', toHub: prefill.toHub || 'kitwe', customer: s(prefill.customer), customerPhone: s(prefill.customerPhone),
    customerEmail: s(prefill.customerEmail), cargo: s(prefill.cargo), weight: s(prefill.weight), truckType: s(prefill.truckType), truckReg: '',
    driver: '', driverPhone: '', loadDate: prefill.loadDate || todayISO(), eta: '', rate: s(prefill.rate), currency: prefill.currency || COMPANY.currencies[0], notes: s(prefill.notes)
  });
  const [invalid, setInvalid] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof F) => (e: { target: { value: string } }) => setF(x => ({ ...x, [k]: e.target.value }));

  const r = useMemo(() => (f.fromHub !== f.toHub ? routeBetween(f.fromHub, f.toHub) : null), [f.fromHub, f.toHub]);
  const info = r ? describe(r.best) : null;
  const etaGuess = r && f.loadDate ? addDaysISO(f.loadDate, Math.max(1, driveDays(r.best.km) + (info?.borders.length ?? 0))) : '';

  async function submit(e: FormEvent) {
    e.preventDefault();
    const bad = (['customer', 'customerPhone', 'cargo'] as const).filter(k => !f[k].trim());
    setInvalid(Object.fromEntries(bad.map(k => [k, true])));
    if (bad.length) { document.getElementById('n-' + bad[0])?.focus(); return; }
    if (f.fromHub === f.toHub) { toast('Pick two different towns'); return; }
    setBusy(true);
    try {
      const load = await api.createLoad({
        fromHub: f.fromHub, toHub: f.toHub, customer: f.customer.trim(), customerPhone: f.customerPhone.trim(), customerEmail: f.customerEmail.trim(),
        cargo: f.cargo.trim(), weight: f.weight ? +f.weight : null, truckType: f.truckType, truckReg: f.truckReg.trim(), driver: f.driver.trim(),
        driverPhone: f.driverPhone.trim(), loadDate: f.loadDate || null, eta: f.eta || etaGuess || null, rate: f.rate === '' ? null : +f.rate,
        currency: f.currency, notes: f.notes, quoteId: prefill.quoteId ?? null
      });
      await refresh();
      toast(`${load.ref} created`);
      openLoad(load.ref);
      message({ to: load.customer, phone: toIntl(load.customerPhone, phoneCountry(f.fromHub)), text: bookingMessage(load), title: 'Send the booking confirmation?' });
    } catch (err) { toast(err instanceof Error ? err.message : 'Could not create the load'); }
    finally { setBusy(false); }
  }

  const field = (k: keyof F, label: string, o: { type?: string; req?: boolean; full?: boolean; placeholder?: string } = {}) => (
    <div className={'field' + (o.full ? ' full' : '') + (invalid[k] ? ' invalid' : '')}>
      <label htmlFor={'n-' + k}>{label}{o.req && <> <span className="req">*</span></>}</label>
      <input id={'n-' + k} type={o.type || 'text'} value={f[k]} onChange={set(k)} placeholder={o.placeholder} {...(o.type === 'number' ? { min: 0, step: 0.1 } : {})} />
      {o.req && <span className="err">This is required.</span>}
    </div>
  );

  return (
    <>
      <div className="dr-head">
        <div><p className="dr-eyebrow mono">New load</p><h2 id="dr-title">Book a load</h2><p className="muted">Creates a tracking reference the customer can follow.</p></div>
        <button className="icon-btn" type="button" data-close aria-label="Close" onClick={closeDrawer}><IconX /></button>
      </div>
      <div className="dr-body">
        <form className="det" noValidate onSubmit={submit}>
          <p className="form-sub">Route</p>
          <div className="field"><label htmlFor="n-fromHub">From</label><select id="n-fromHub" value={f.fromHub} onChange={set('fromHub')}><HubOptions /></select></div>
          <div className="field"><label htmlFor="n-toHub">To</label><select id="n-toHub" value={f.toHub} onChange={set('toHub')}><HubOptions /></select></div>
          <div className="full route-preview">
            {f.fromHub === f.toHub ? <p className="muted">Pick two different towns.</p> : r && info && (
              <>
                <p className="num"><b>≈{fmt(r.best.km)} km</b> · {info.borders.length ? `${info.borders.length} border ${info.borders.length > 1 ? 'posts' : 'post'}` : 'no border crossing'}</p>
                <div className="chips"><BorderChips borders={info.borders} /></div>
              </>
            )}
          </div>
          <p className="form-sub">Customer</p>
          {field('customer', 'Customer or company', { req: true })}
          {field('customerPhone', 'Customer phone', { type: 'tel', req: true })}
          {field('customerEmail', 'Customer email', { type: 'email', full: true })}
          <p className="form-sub">Cargo and truck</p>
          {field('cargo', 'Cargo', { req: true })}
          {field('weight', 'Weight (t)', { type: 'number' })}
          <div className="field"><label htmlFor="n-truckType">Truck type</label>
            <select id="n-truckType" value={f.truckType} onChange={set('truckType')}><option value="">-</option>{TRUCKS.map(t => <option key={t}>{t}</option>)}</select></div>
          {field('truckReg', 'Truck reg', { placeholder: 'e.g. ABC 1234' })}
          {field('driver', 'Driver')}
          {field('driverPhone', 'Driver phone', { type: 'tel' })}
          <p className="form-sub">Dates and rate</p>
          {field('loadDate', 'Loading date', { type: 'date' })}
          {field('eta', 'Estimated delivery', { type: 'date', placeholder: etaGuess })}
          <div className="field"><label htmlFor="n-rate">Rate</label><div className="rate-row">
            <select aria-label="Currency" value={f.currency} onChange={set('currency')}><CurrencyOptions /></select>
            <input id="n-rate" type="number" min={0} step={50} value={f.rate} onChange={set('rate')} /></div></div>
          <div className="field full"><label htmlFor="n-notes">Internal notes</label><textarea id="n-notes" value={f.notes} onChange={set('notes')} /></div>
          <div className="field full btn-row"><button className="btn btn-red" type="submit" disabled={busy}><IconPlus />{busy ? 'Creating...' : 'Create load'}</button></div>
        </form>
      </div>
    </>
  );
}
