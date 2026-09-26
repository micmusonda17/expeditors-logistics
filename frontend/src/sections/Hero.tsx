import { useMemo } from 'react';
import { BORDERS, HUBS, LANES, daysText, describe, hubName, isComingSoon, isPublicHub, routeBetween } from '../lib/network';
import { fmt } from '../lib/format';
import { COMPANY } from '../config';
import { useSite } from '../site/SiteContext';
import { BorderChips } from '../components/BorderChips';
import { IconArrow, IconSwap } from '../components/Icons';

function HubOptions() {
  const keys = Object.keys(HUBS).filter(k => !HUBS[k].minor && isPublicHub(k)).sort((a, b) => hubName(a).localeCompare(hubName(b)));
  return (
    <>
      <optgroup label="Zambia">{keys.filter(k => HUBS[k].country === 'ZM').map(k => <option key={k} value={k}>{hubName(k)}</option>)}</optgroup>
      <optgroup label="South Africa (coming soon)">{keys.filter(k => HUBS[k].country === 'ZA').map(k => <option key={k} value={k}>{hubName(k)}</option>)}</optgroup>
    </>
  );
}

function Planner() {
  const { plan, setPlan, requestQuote } = useSite();
  const { from, to } = plan;
  const result = useMemo(() => {
    if (from === to) return null;
    const r = routeBetween(from, to);
    return r ? { r, info: describe(r.best), altInfo: r.alt ? describe(r.alt) : null } : null;
  }, [from, to]);
  const soon = isComingSoon(from) || isComingSoon(to);

  return (
    <form className="planner" aria-label="Route planner" onSubmit={e => e.preventDefault()}>
      <div className="field">
        <label htmlFor="p-from">From</label>
        <select id="p-from" value={from} onChange={e => setPlan(e.target.value, to)}><HubOptions /></select>
      </div>
      <button type="button" className="swap" aria-label="Swap origin and destination" onClick={() => setPlan(to, from)}><IconSwap /></button>
      <div className="field">
        <label htmlFor="p-to">To</label>
        <select id="p-to" value={to} onChange={e => setPlan(from, e.target.value)}><HubOptions /></select>
      </div>
      <div className="planner-result" aria-live="polite">
        {from === to ? <span className="planner-alt">Choose two different towns.</span>
          : !result ? <span className="planner-alt">Ask us about this route.</span>
          : (
            <>
              <div className="planner-km num">≈{fmt(result.r.best.km)}<small>road km</small></div>
              <div className="chips">
                {result.info.borders.length ? <BorderChips borders={result.info.borders} /> : <span className="chip" style={{ paddingLeft: 10 }}>No border crossing</span>}
              </div>
              <div className="planner-alt">
                {daysText(result.r.best.km, result.info.borders.length)}
                {soon && <> <span className="soon-pill">South Africa coming soon</span></>}
              </div>
              {result.altInfo && result.info.borders.length > 0 && (
                <div className="planner-alt">
                  Alternative via {result.altInfo.borders.filter(x => !result.info.borders.includes(x)).map(x => BORDERS[x].name).join(' and ') || 'another road'}: ≈{fmt(result.r.alt!.km)} km
                </div>
              )}
            </>
          )}
      </div>
      <button type="button" className="btn btn-red go" onClick={() => requestQuote(from, to)}>Quote this route</button>
    </form>
  );
}

function Lanes() {
  const items = LANES.map(l => ({ ...l, km: routeBetween(l.from, l.to)?.best.km })).filter(l => l.km);
  const row = (hidden: boolean) => items.map(l => (
    <div key={(hidden ? 'h' : '') + l.from + l.to} className={'lane' + (l.soon ? ' soon' : '')} aria-hidden={hidden || undefined}>
      <b>{hubName(l.from)}</b><span className="arrow">→</span><b>{hubName(l.to)}</b>
      <span className="km num">{l.soon ? 'Coming soon' : `≈${fmt(l.km!)} km`}</span>
    </div>
  ));
  return (
    <div className="lanes" aria-label="Popular lanes">
      <div className="lanes-track">{row(false)}{row(true)}</div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="wrap">
        <div className="hero-grid">
          <div>
            <p className="eyebrow">Lusaka road freight since {COMPANY.founded} · South Africa coming soon</p>
            <h1 id="hero-title" className="display">Road freight across Zambia, <span className="red">chilled or dry.</span></h1>
            <p className="lede">Expeditors Logistics is a family-owned trucking company based in Lusaka, on the road since {COMPANY.founded}. Our refrigerated and containerised trucks deliver all kinds of goods, chilled, frozen or dry, across Zambia: from the Copperbelt to Livingstone, Chipata, Kasama and Mongu. Trips to South Africa are coming soon.</p>
            <div className="hero-actions">
              <a className="btn btn-red" href="#quote">Get a quote <IconArrow /></a>
              <a className="btn btn-ghost" href="#track">Track a load</a>
            </div>
            <div className="coverage" aria-label="Where we operate">
              <span className="coverage-label">Operating across</span><span className="cc home" title="Zambia">ZM</span>
              <span className="coverage-label">Coming soon</span><span className="cc next" title="South Africa">ZA</span>
            </div>
          </div>
          <div className="hero-art" aria-hidden>
            <span className="speed s1" /><span className="speed s2" /><span className="speed s3" />
            <img src="assets/img/emblem.png" alt="" width={916} height={314} />
          </div>
        </div>
        <Planner />
      </div>
      <Lanes />
    </section>
  );
}
