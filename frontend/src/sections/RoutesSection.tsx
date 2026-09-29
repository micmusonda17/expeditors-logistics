import { useEffect, useMemo, useRef, useState } from 'react';
import { CORRIDORS, CORRIDOR_GROUPS, hubName, isComingSoon, pathFromNodes, routeBetween, type LatLon, type Route } from '../lib/network';
import { fmt } from '../lib/format';
import { createMap, type SouthernMap } from '../map/SouthernMap';
import { useSite } from '../site/SiteContext';
import { RouteCard } from '../components/RouteCard';

type View = 'zm' | 'sa' | 'lp';
const VIEWS: Record<View, [LatLon, LatLon]> = {
  zm: [[-18.2, 21.6], [-8.2, 33.9]],
  sa: [[-26.9, 23.6], [-12.2, 32.4]],
  lp: [[-25.4, 26.9], [-21.8, 31.7]]
};
const VIEW_LABELS: [View, string][] = [['zm', 'Zambia'], ['sa', 'South Africa · soon'], ['lp', 'Limpopo · soon']];

function routeFor(sel: { kind: string; from: string; to: string; corridorId?: string }): Route | null {
  if (sel.kind === 'corridor') {
    const c = CORRIDORS.find(x => x.id === sel.corridorId);
    return c ? pathFromNodes(c.path) : null;
  }
  return routeBetween(sel.from, sel.to)?.best ?? null;
}

export function RoutesSection({ head = true }: { head?: boolean } = {}) {
  const site = useSite();
  const { selection, mapFrom, setMapFrom, requestQuote } = site;
  const svgRef = useRef<SVGSVGElement>(null);
  const mapRef = useRef<SouthernMap | null>(null);
  const handlers = useRef(site);
  handlers.current = site;
  const [view, setView] = useState<View | null>('zm');

  const showView = (v: View | null, animate = true) => {
    setView(v);
    if (v) mapRef.current?.view(VIEWS[v], { animate });
  };

  useEffect(() => {
    const map = createMap(svgRef.current!, {
      aspect: 1000 / 1143, local: true, interactive: true,
      onHub: k => handlers.current.pickTown(k),
      onCountry: id => showView(id === '710' ? 'sa' : 'zm')
    });
    mapRef.current = map;
    return () => map.destroy();
  }, []);

  const route = useMemo(() => routeFor(selection), [selection]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !route) return;
    if (selection.nonce === 0) {
      map.showRoute(route, { animate: true });
      showView('zm', false);
    } else {
      setView(null);
      map.focus(route);
    }
  }, [selection.nonce, route]);

  const corridor = selection.kind === 'corridor' ? CORRIDORS.find(c => c.id === selection.corridorId) : undefined;
  const soon = isComingSoon(selection.from) || isComingSoon(selection.to);
  const title = corridor ? corridor.name : `${hubName(selection.from)} to ${hubName(selection.to)}`;
  const sub = corridor ? corridor.note : selection.kind === 'map' ? 'Picked on the map.' : 'Your route from the planner.';
  const picked = selection.kind === 'map' && mapFrom === selection.from && route;

  return (
    <section className="section routes" id="routes" aria-labelledby={head ? 'routes-title' : undefined}>
      <div className="wrap">
        {head && (
          <div className="section-head">
            <div>
              <p className="eyebrow">Routes · Zambia</p>
              <h2 id="routes-title" className="display">Where we run</h2>
            </div>
            <p className="lede">We run across Zambia, from the Copperbelt to Livingstone and from Mongu to Chipata. Trips to Limpopo, Pretoria and Johannesburg are coming soon. Pick a route, or click any town on the map.</p>
          </div>
        )}
        <div className="routes-grid">
          <div>
            <div className="corridors" aria-label="Routes">
              {CORRIDOR_GROUPS.map(g => (
                <div className={'cgroup' + (g.id === 'sa' ? ' soon' : '')} key={g.id}>
                  <div className="cgroup-h"><h3>{g.name}</h3><span className={`ctag ${g.id}`}>{g.tag}</span></div>
                  <div className="cgroup-list">
                    {CORRIDORS.filter(c => c.group === g.id).map(c => {
                      const r = pathFromNodes(c.path);
                      return (
                        <button key={c.id} type="button" className="corridor" aria-pressed={selection.corridorId === c.id} onClick={() => site.selectCorridor(c.id)}>
                          <span className="c-name">{c.name}</span>
                          <span className="c-km num">≈{fmt(r?.km ?? 0)} km</span>
                          <span className="c-ends">{hubName(c.path[0])} to {hubName(c.path[c.path.length - 1])}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="route-card" aria-live="polite">
              {route && <RouteCard title={title} sub={sub} route={route} soon={corridor ? corridor.group === 'sa' : soon} onQuote={requestQuote} />}
            </div>
          </div>
          <figure className="map-wrap">
            <div className="map-frame">
              <div className="map-views" role="group" aria-label="Map view">
                {VIEW_LABELS.map(([v, label]) => (
                  <button key={v} type="button" aria-pressed={view === v} onClick={() => showView(v)}>{label}</button>
                ))}
              </div>
              <svg ref={svgRef} id="map" role="img" aria-label="Map of Zambia showing Expeditors routes, with trips to South Africa coming soon" />
            </div>
            <div className="map-pick" aria-live="polite">
              {picked ? (
                <>
                  <span className="mp-text">
                    <b>{hubName(selection.from)}</b> to <b>{hubName(selection.to)}</b>
                    <span className="mp-km">≈{fmt(route.km)} km</span>
                    {soon && <span className="soon-pill">Coming soon</span>}
                  </span>
                  <span className="mp-actions">
                    <button type="button" className="linkbtn" onClick={() => requestQuote(selection.from, selection.to)}>{soon ? 'Ask about' : 'Quote'} this route</button>
                    {mapFrom !== selection.to && (
                      <button type="button" className="linkbtn" onClick={() => { setMapFrom(selection.to); showView(isComingSoon(selection.to) ? 'sa' : 'zm'); }}>
                        Start from {hubName(selection.to)}
                      </button>
                    )}
                  </span>
                </>
              ) : (
                <>
                  <span className="mp-text">Starting from <b>{hubName(mapFrom)}</b>. Click any town on the map to see the route and distance.</span>
                  {mapFrom !== 'lusaka' && (
                    <span className="mp-actions">
                      <button type="button" className="linkbtn" onClick={() => { setMapFrom('lusaka'); showView('zm'); }}>Start from Lusaka</button>
                    </span>
                  )}
                </>
              )}
            </div>
            <figcaption>
              <div className="legend">
                <span><i className="lg-city" />City</span>
                <span><i className="lg-bp" />Border post</span>
                <span><i className="lg-zm" />Zambia network</span>
                <span><i className="lg-sa" />South Africa, coming soon</span>
                <span><i className="lg-route" />Selected route</span>
              </div>
              <p className="map-note">Click a town on the map to see the route and distance. Distances are approximate road kilometres for planning; your quote confirms the exact route.</p>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
