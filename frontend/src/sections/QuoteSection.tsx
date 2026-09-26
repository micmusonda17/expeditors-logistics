import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { api, ApiError, type QuoteInput } from '../api';
import { COMPANY, IS_DEMO } from '../config';
import { BORDERS, HUBS, daysText, describe, hubLabel, hubName, isComingSoon, isPublicHub, matchHub, routeBetween } from '../lib/network';
import { fmt, smooth, todayISO, waLink } from '../lib/format';
import { copyText } from '../lib/clipboard';
import { useSite } from '../site/SiteContext';
import { BorderChips } from '../components/BorderChips';
import { IconArrow, IconChat, IconCheck, IconClock } from '../components/Icons';
import { toast } from '../components/Toast';

const EMPTY = { service: 'One-off load', name: '', company: '', phone: '', email: '', pickup: '', delivery: '', cargo: '', weight: '', truck: 'Not sure, please advise', loadDate: '', notes: '', website: '' };
type Form = typeof EMPTY;
type Field = keyof Form;

const VALIDATORS: Partial<Record<Field, [(v: string) => boolean, string]>> = {
  name: [v => v.trim().length >= 2, 'Enter your name.'],
  phone: [v => v.replace(/\D/g, '').length >= 9, 'Enter a phone number with country code, for example +260 97 000 0000.'],
  email: [v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()), 'Check the email address.'],
  pickup: [v => v.trim().length >= 2, 'Enter where we collect the load.'],
  delivery: [v => v.trim().length >= 2, 'Enter where we deliver the load.'],
  cargo: [v => !!v, 'Choose a cargo type.'],
  weight: [v => !v || (+v > 0 && +v <= 200), 'Enter a weight between 0 and 200 tonnes.'],
  loadDate: [v => !v || v >= todayISO(), 'Choose a date from today onwards.']
};

function trucksLine(w: number, cargo: string) {
  if (!(w > 0)) return '';
  if (cargo.startsWith('Chilled')) return w <= 5 ? ' Fits one of our refrigerated trucks (3 to 5 t).' : ' Above 5 t: we will split it across refrigerated trucks or advise on a bigger one.';
  if (w <= 3) return ' Fits one of our containerised trucks (2 to 3 t).';
  if (w <= 5) return ' Fits one of our 3 to 5 t trucks.';
  return ' Above 5 t: we will split it across trucks or advise on a bigger one.';
}

function summaryText(f: Form, ref: string, km: number, borders: string[]) {
  const block = (arr: (string | false | undefined)[]) => arr.filter(Boolean).join('\n');
  const day = f.loadDate ? new Date(f.loadDate + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  return [
    `Quote request ${ref}`,
    block([`Name: ${f.name}`, f.company && `Company: ${f.company}`, `Phone: ${f.phone}`, f.email && `Email: ${f.email}`]),
    block([`Service: ${f.service}`, `From: ${f.pickup}`, `To: ${f.delivery}`,
      km > 0 && `Approx. distance: ${fmt(km)} km${borders.length ? ` via ${borders.map(b => BORDERS[b].name).join(', ')}` : ''}`,
      `Cargo: ${f.cargo}`, f.weight && `Weight: ${f.weight} t`, `Truck: ${f.truck}`, day && `Loading date: ${day}`, f.notes && `Notes: ${f.notes}`])
  ].join('\n\n');
}

interface Done { ref: string; summary: string; received: boolean; error?: string }

export function QuoteSection() {
  const { quotePrefill } = useSite();
  const [form, setForm] = useState<Form>(EMPTY);
  const [invalid, setInvalid] = useState<Partial<Record<Field, boolean>>>({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!quotePrefill) return;
    setDone(null);
    setForm(f => ({ ...f, pickup: hubLabel(quotePrefill.from), delivery: hubLabel(quotePrefill.to) }));
    const t = window.setTimeout(() => nameRef.current?.focus({ preventScroll: true }), 650);
    return () => window.clearTimeout(t);
  }, [quotePrefill]);

  const set = (k: Field) => (e: { target: { value: string } }) => {
    const v = e.target.value;
    setForm(f => ({ ...f, [k]: v }));
    if (invalid[k]) setInvalid(s => ({ ...s, [k]: !VALIDATORS[k]![0](v) }));
  };
  const check = (k: Field) => () => { const val = VALIDATORS[k]; if (val && form[k]) setInvalid(s => ({ ...s, [k]: !val[0](form[k]) })); };

  const est = useMemo(() => {
    const a = matchHub(form.pickup), b = matchHub(form.delivery);
    if (!a || !b || a === b) return null;
    const r = routeBetween(a, b);
    return r ? { a, b, r, info: describe(r.best) } : null;
  }, [form.pickup, form.delivery]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (form.website) return;
    const bad = (Object.keys(VALIDATORS) as Field[]).filter(k => !VALIDATORS[k]![0](form[k]));
    setInvalid(Object.fromEntries(bad.map(k => [k, true])));
    if (bad.length) { document.getElementById('q-' + bad[0])?.focus(); toast('Check the highlighted fields'); return; }

    const input: QuoteInput = { ...form, weight: form.weight ? +form.weight : null, loadDate: form.loadDate || null };
    setSending(true);
    let result: Done;
    try {
      const receipt = await api.submitQuote(input);
      result = { ref: receipt.ref, summary: summaryText(form, receipt.ref, est?.r.best.km ?? receipt.km, est?.info.borders ?? []), received: api.mode === 'live' };
    } catch (err) {
      const d = new Date(), p = (x: number) => String(x).padStart(2, '0');
      const ref = `Q${String(d.getFullYear()).slice(2)}${p(d.getMonth() + 1)}${p(d.getDate())}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      result = {
        ref, summary: summaryText(form, ref, est?.r.best.km ?? 0, est?.info.borders ?? []), received: false,
        error: err instanceof ApiError && err.status === 429 ? err.message : 'We could not send the form automatically. Please send it with one of the options below.'
      };
    }
    setSending(false);
    setDone(result);
    requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: smooth(), block: 'start' }));
  }

  const reset = () => { setForm(EMPTY); setInvalid({}); setDone(null); requestAnimationFrame(() => nameRef.current?.focus()); };
  const hubOptions = Object.keys(HUBS).filter(isPublicHub);
  const err = (k: Field) => VALIDATORS[k] && <span className="err">{VALIDATORS[k]![1]}</span>;
  const fieldCls = (k: Field, extra = '') => 'field' + (invalid[k] ? ' invalid' : '') + (extra ? ' ' + extra : '');
  const n = est?.info.borders.length ?? 0;

  return (
    <section className="section" id="quote" aria-labelledby="quote-title">
      <div className="wrap">
        <div className="section-head">
          <div>
            <p className="eyebrow">Quote</p>
            <h2 id="quote-title" className="display">Request a quote</h2>
          </div>
          <p className="lede">The more we know about the load, the faster and more accurate the rate. Fields marked * are required.</p>
        </div>
        <div className="quote-grid">
          <div className="panel" ref={panelRef}>
            {!done ? (
              <form noValidate onSubmit={submit}>
                <div className="form-grid">
                  <p className="form-sub">Your details</p>
                  <div className={fieldCls('name')}><label htmlFor="q-name">Full name <span className="req">*</span></label><input id="q-name" ref={nameRef} autoComplete="name" value={form.name} onChange={set('name')} onBlur={check('name')} aria-invalid={!!invalid.name} />{err('name')}</div>
                  <div className="field"><label htmlFor="q-company">Company</label><input id="q-company" autoComplete="organization" value={form.company} onChange={set('company')} /></div>
                  <div className={fieldCls('phone')}><label htmlFor="q-phone">Phone or WhatsApp <span className="req">*</span></label><input id="q-phone" type="tel" autoComplete="tel" placeholder="+260 or +27 number" value={form.phone} onChange={set('phone')} onBlur={check('phone')} aria-invalid={!!invalid.phone} />{err('phone')}</div>
                  <div className={fieldCls('email')}><label htmlFor="q-email">Email</label><input id="q-email" type="email" autoComplete="email" value={form.email} onChange={set('email')} onBlur={check('email')} aria-invalid={!!invalid.email} />{err('email')}</div>

                  <p className="form-sub">The load</p>
                  <div className="field"><label htmlFor="q-service">Service</label>
                    <select id="q-service" value={form.service} onChange={set('service')}><option>One-off load</option><option>Dedicated truck hire (daily or monthly)</option></select></div>
                  <div className={fieldCls('pickup')}><label htmlFor="q-pickup">Pickup town <span className="req">*</span></label><input id="q-pickup" list="hub-list" placeholder="e.g. Kitwe" value={form.pickup} onChange={set('pickup')} onBlur={check('pickup')} aria-invalid={!!invalid.pickup} />{err('pickup')}</div>
                  <div className={fieldCls('delivery')}><label htmlFor="q-delivery">Delivery town <span className="req">*</span></label><input id="q-delivery" list="hub-list" placeholder="e.g. Livingstone" value={form.delivery} onChange={set('delivery')} onBlur={check('delivery')} aria-invalid={!!invalid.delivery} />{err('delivery')}</div>
                  <div className={fieldCls('cargo')}><label htmlFor="q-cargo">Cargo type <span className="req">*</span></label>
                    <select id="q-cargo" value={form.cargo} onChange={set('cargo')} aria-invalid={!!invalid.cargo}>
                      <option value="">Choose cargo type</option>
                      {['Chilled or frozen food', 'General or palletised', 'Bagged (maize, fertiliser, cement)', 'Beverages and groceries', 'Building materials', 'Other'].map(c => <option key={c}>{c}</option>)}
                    </select>{err('cargo')}</div>
                  <div className={fieldCls('weight')}><label htmlFor="q-weight">Weight in tonnes</label><input id="q-weight" type="number" inputMode="decimal" min={0} max={200} step={0.1} placeholder="e.g. 5" value={form.weight} onChange={set('weight')} onBlur={check('weight')} />{err('weight')}</div>
                  <div className="field"><label htmlFor="q-truck">Truck type</label>
                    <select id="q-truck" value={form.truck} onChange={set('truck')}>
                      {['Not sure, please advise', 'Refrigerated truck (3 to 5 t)', 'Containerised truck (2 to 3 t)', 'Bigger than 5 t'].map(t => <option key={t}>{t}</option>)}
                    </select></div>
                  <div className={fieldCls('loadDate')}><label htmlFor="q-loadDate">Loading date</label><input id="q-loadDate" type="date" min={todayISO()} value={form.loadDate} onChange={set('loadDate')} onBlur={check('loadDate')} />{err('loadDate')}</div>
                  <div className="field full"><label htmlFor="q-notes">Anything else</label><textarea id="q-notes" placeholder="Number of loads, dimensions, cargo value, special handling, return load..." value={form.notes} onChange={set('notes')} /></div>
                  <div className="hp" aria-hidden><label htmlFor="q-website">Leave empty</label><input id="q-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} /></div>
                </div>
                <datalist id="hub-list">{hubOptions.map(k => <option key={k} value={hubLabel(k)} />)}</datalist>
                <div className="form-actions">
                  <button className="btn btn-red" type="submit" disabled={sending}>{sending ? 'Sending...' : 'Send quote request'} <IconArrow /></button>
                  <span className="small">We only use your details to reply to this request.</span>
                </div>
              </form>
            ) : (
              <DonePanel done={done} onNew={reset} />
            )}
          </div>
          <aside className="aside">
            <div className="route-check" aria-live="polite">
              <div className="label">Route check</div>
              {!est ? (
                <p className="empty">Pick a pickup and delivery town from the list to see the approximate distance and border posts. Other towns are fine too, we will route them for you.</p>
              ) : (
                <>
                  <div className="rk num">≈{fmt(est.r.best.km)} <small>road km</small></div>
                  <p className="rv">{hubName(est.a)} to {hubName(est.b)}{n ? `, ${n} border ${n > 1 ? 'posts' : 'post'}` : ', no border crossing'}</p>
                  {n > 0 && <div className="chips"><BorderChips borders={est.info.borders} /></div>}
                  <p className="rv">{daysText(est.r.best.km, n)}.{trucksLine(+form.weight, form.cargo)}</p>
                  {(isComingSoon(est.a) || isComingSoon(est.b)) && <p className="soon">South Africa trips are coming soon. Send your request and we will let you know when we start.</p>}
                </>
              )}
            </div>
            <div className="panel">
              <h3>What happens next</h3>
              <ul className="next-list">
                <li><IconClock /><span>We check truck availability for your loading date.</span></li>
                <li><IconChat /><span>You get a rate on WhatsApp or email, with the route and distance.</span></li>
                <li><IconCheck /><span>Confirm and we book the truck. No obligation until you confirm.</span></li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function DonePanel({ done, onNew }: { done: Done; onNew(): void }) {
  const email = COMPANY.emails.join(',');
  const mail = email ? `mailto:${email}?subject=${encodeURIComponent('Quote request ' + done.ref)}&body=${encodeURIComponent(done.summary)}` : '';
  return (
    <div className="done">
      <div className="done-head">
        <div className="tick"><IconCheck /></div>
        <div>
          <h3>{done.received ? 'Request received' : 'Your request is ready to send'}</h3>
          <p>
            {done.received
              ? <>Thank you. Your reference is <b className="mono">{done.ref}</b>. We will reply on the number you gave us. For anything urgent, message us on WhatsApp with this reference.</>
              : <>Reference <b className="mono">{done.ref}</b>. Send it to us using one of the options below and we will reply with a rate.</>}
          </p>
        </div>
      </div>
      {done.error && <p className="notice">{done.error}</p>}
      {IS_DEMO && !done.error && <p className="notice">Preview: this request has also been added to the sample operations portal, so you can see how the team receives it. <a href="#admin">Open the portal</a></p>}
      <pre className="summary">{done.summary}</pre>
      <div className="done-actions">
        {COMPANY.whatsapp && <a className="btn btn-wa" href={waLink(done.summary)} target="_blank" rel="noopener">{done.received ? 'Also send on WhatsApp' : 'Send on WhatsApp'}</a>}
        {!done.received && email && <a className="btn" href={mail}>Send by email</a>}
        <button className="btn btn-ghost" type="button" onClick={() => copyText(done.summary)}>Copy request</button>
        <button className="btn btn-ghost" type="button" onClick={onNew}>New request</button>
      </div>
    </div>
  );
}
