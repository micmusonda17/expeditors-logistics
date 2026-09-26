import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { api, type Tracking } from '../api';
import { COMPANY, IS_DEMO } from '../config';
import { STAGES, describe, routeBetween, type Route } from '../lib/network';
import { ago, fmt, fmtDateTime, fmtDay, trackingLink, waLink } from '../lib/format';
import { copyText } from '../lib/clipboard';
import { createMap } from '../map/SouthernMap';

function sampleShipment(): Tracking {
  const now = Date.now(), H = 3600e3;
  const iso = (ago: number) => new Date(now - ago).toISOString();
  const ev = (t: number, status: string, at: string, location: string, note = '') => ({ status, at, location, note, createdAt: iso(t) });
  return {
    ref: 'ELL-SAMPLE', origin: 'Lusaka, Zambia', destination: 'Kitwe, Zambia', fromHub: 'lusaka', toHub: 'kitwe',
    status: 'In transit', at: 'kabwe', location: 'Kabwe', eta: new Date(now + 5 * H).toISOString().slice(0, 10),
    note: 'This is a sample shipment that shows how tracking looks. Real loads appear here once a booking is confirmed.',
    updatedAt: iso(35 * 60e3), sample: true,
    events: [ev(20 * H, 'Booked', 'lusaka', 'Lusaka'), ev(3 * H, 'Loaded', 'lusaka', 'Lusaka', 'Loaded and sealed, reefer set to 2°C.'), ev(35 * 60e3, 'In transit', 'kabwe', 'Kabwe', 'On the Great North Road, on schedule.')]
  };
}

type State = { kind: 'idle' } | { kind: 'loading'; ref: string } | { kind: 'found'; s: Tracking } | { kind: 'missing'; ref: string; error: boolean };

function RouteMap({ route, at }: { route: Route; at: string }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const m = createMap(ref.current!, { labels: 'route', countryLabels: true, aspect: 1.7, unitBoost: 1.5, local: true });
    m.fit(route, 0.14);
    m.showRoute(route, { truckAt: at || null });
    return () => m.destroy();
  }, [route, at]);
  return <div className="wb-map"><svg ref={ref} aria-label="Route map with the truck position" /></div>;
}

function Waybill({ s }: { s: Tracking }) {
  const route = useMemo(() => routeBetween(s.fromHub, s.toHub)?.best ?? null, [s.fromHub, s.toHub]);
  const crosses = (route && describe(route).borders.length > 0) || /border/i.test(s.status);
  const stages = crosses ? STAGES : STAGES.filter(x => x !== 'At border');
  const idx = Math.max(0, stages.findIndex(x => x.toLowerCase() === s.status.toLowerCase()));
  const delivered = idx === stages.length - 1;
  const events = [...s.events].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const msg = `Hello, please send me the latest status for load ${s.ref}.`;
  return (
    <>
      <div className="wb-head">
        <div><div className="wb-ref">{s.ref}</div><div className="wb-lane">{s.origin} → {s.destination}</div></div>
        <span className={'badge ' + (s.sample ? 'sample' : delivered ? 'ok' : '')}>{s.sample ? 'Sample · ' : ''}{stages[idx]}</span>
      </div>
      {route && <RouteMap route={route} at={s.at} />}
      <div className="wb-body">
        <ol className="stepper" style={{ gridTemplateColumns: `repeat(${stages.length},minmax(0,1fr))` }}>
          {stages.map((st, i) => <li key={st} className={(i < idx || delivered ? 'done' : '') + (i === idx && !delivered ? ' now' : '')}>{st}</li>)}
        </ol>
        <dl className="wb-rows">
          <div><dt>Current location</dt><dd>{s.location || '-'}</dd></div>
          <div><dt>Last update</dt><dd className="num">{ago(s.updatedAt) || '-'}</dd></div>
          <div><dt>{delivered ? 'Delivered' : 'Estimated delivery'}</dt><dd className="num">{fmtDay(s.eta)}</dd></div>
          <div><dt>Distance</dt><dd className="num">{route ? `≈${fmt(route.km)} km` : '-'}</dd></div>
        </dl>
        {s.note && <p className="wb-note">{s.note}</p>}
        {events.length > 0 && (
          <ol className="timeline">
            {events.map((e, i) => (
              <li key={i}>
                <div className="tl-top"><span className="tl-st">{e.status}</span><span className="tl-loc">{e.location}</span><span className="tl-t">{fmtDateTime(e.createdAt)}</span></div>
                {e.note && <div className="tl-note">{e.note}</div>}
              </li>
            ))}
          </ol>
        )}
        {!s.sample && (
          <div className="wb-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => copyText(trackingLink(s.ref))}>Copy tracking link</button>
            {COMPANY.whatsapp && <a className="btn btn-wa btn-sm" href={waLink(msg)} target="_blank" rel="noopener">Ask on WhatsApp</a>}
          </div>
        )}
      </div>
    </>
  );
}

export function TrackSection({ deepLink }: { deepLink?: string }) {
  const [input, setInput] = useState('');
  const [state, setState] = useState<State>(() => (COMPANY.showSampleShipment ? { kind: 'found', s: sampleShipment() } : { kind: 'idle' }));

  const track = useCallback(async (raw: string) => {
    const ref = raw.trim().toUpperCase().replace(/\s+/g, '');
    if (!ref) return;
    setInput(ref);
    setState({ kind: 'loading', ref });
    if (COMPANY.showSampleShipment && ref === 'ELL-SAMPLE') { setState({ kind: 'found', s: sampleShipment() }); return; }
    try {
      const s = await api.getTracking(ref);
      setState(s ? { kind: 'found', s } : { kind: 'missing', ref, error: false });
    } catch {
      setState({ kind: 'missing', ref, error: true });
    }
  }, []);

  useEffect(() => {
    if (!deepLink) return;
    track(deepLink);
    document.getElementById('track')?.scrollIntoView();
  }, [deepLink, track]);

  const tries = [COMPANY.showSampleShipment && 'ELL-SAMPLE', IS_DEMO && 'ELL-7K3Q9'].filter(Boolean) as string[];
  const submit = (e: FormEvent) => { e.preventDefault(); track(input); };

  return (
    <section className="section track" id="track" aria-labelledby="track-title">
      <div className="wrap track-grid">
        <div>
          <p className="eyebrow">Tracking</p>
          <h2 id="track-title" className="display" style={{ fontSize: 'clamp(2rem,4.2vw,3.25rem)', marginTop: 14 }}>Track a load</h2>
          <p className="lede" style={{ marginTop: 16 }}>Enter the reference from your booking confirmation. Status is updated by our operations team as the truck moves.</p>
          <form className="track-form" onSubmit={submit}>
            <label className="sr-only" htmlFor="t-ref">Load reference</label>
            <input id="t-ref" placeholder="Load reference, e.g. ELL-24031" autoComplete="off" spellCheck={false} value={input} onChange={e => setInput(e.target.value)} />
            <button className="btn btn-red" type="submit">Track</button>
          </form>
          <p className="track-hint">
            {tries.length
              ? <>Try {tries.map((r, i) => <span key={r}>{i > 0 && ' or '}<button type="button" className="t-try" onClick={() => track(r)}><code>{r}</code></button></span>)}</>
              : 'Your reference starts with ELL and is on your booking confirmation.'}
          </p>
        </div>
        <div className="waybill" aria-live="polite">
          {state.kind === 'idle' && <div className="wb-empty"><h3>Enter a reference to see your load</h3><p>You will see the current stage, location, a map of the route and every update.</p></div>}
          {state.kind === 'loading' && <div className="wb-empty"><p>Looking up {state.ref}...</p></div>}
          {state.kind === 'found' && <Waybill s={state.s} />}
          {state.kind === 'missing' && (
            <>
              <div className="wb-head"><div><div className="wb-ref">{state.ref}</div><div className="wb-lane">{state.error ? 'Tracking is temporarily unavailable' : 'No match found'}</div></div></div>
              <div className="wb-empty">
                <h3>{state.error ? 'We could not load tracking right now' : 'We could not find that reference'}</h3>
                <p>{state.error ? 'Try again in a minute, or ask us directly.' : 'Check the reference on your booking confirmation. It starts with ELL. New bookings can take a few hours to appear.'}</p>
                {COMPANY.whatsapp && <div><a className="btn btn-wa btn-sm" href={waLink(`Hello, please send me the latest status for load ${state.ref}.`)} target="_blank" rel="noopener">Ask on WhatsApp</a></div>}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
