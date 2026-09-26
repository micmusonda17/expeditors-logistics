import { BORDERS, ROADS, describe, driveDays, hubName, type Route } from '../lib/network';
import { fmt } from '../lib/format';

interface Props { title: string; sub: string; route: Route; soon?: boolean; onQuote(from: string, to: string): void }

export function RouteCard({ title, sub, route, soon, onQuote }: Props) {
  const info = describe(route);
  const a = route.nodes[0], z = route.nodes[route.nodes.length - 1];
  const days = driveDays(route.km);
  return (
    <>
      <h3>{title}{soon && <span className="soon-pill">Coming soon</span>}</h3>
      <p className="rc-sub">{sub}</p>
      <div className="rc-stats" style={{ gridTemplateColumns: `repeat(${info.borders.length ? 4 : 3},minmax(0,1fr))` }}>
        <div className="rc-stat"><div className="v num">≈{fmt(route.km)}</div><div className="k">Road km</div></div>
        {info.borders.length ? (
          <>
            <div className="rc-stat"><div className="v num">{info.borders.length}</div><div className="k">Border posts</div></div>
            <div className="rc-stat"><div className="v num">{info.countries.length}</div><div className="k">Countries</div></div>
          </>
        ) : (
          <div className="rc-stat"><div className="v num">{route.nodes.length}</div><div className="k">Towns on route</div></div>
        )}
        <div className="rc-stat"><div className="v num">~{days}</div><div className="k">Driving {days > 1 ? 'days' : 'day'}</div></div>
      </div>
      <div className="rc-stops">
        {route.nodes.map((n, i) => {
          const road = i < route.nodes.length - 1 ? ROADS[route.edges[i]] : null;
          const bps = road ? road.via.filter((w): w is string => typeof w === 'string') : [];
          const ordered = road && road.from === n ? bps : bps.slice().reverse();
          return (
            <span key={n + i} style={{ display: 'contents' }}>
              <span>{hubName(n)}</span>
              {road && <span className="sep">›</span>}
              {ordered.map(b => (
                <span key={b} style={{ display: 'contents' }}><span className="bp">{BORDERS[b].name}</span><span className="sep">›</span></span>
              ))}
            </span>
          );
        })}
      </div>
      <button className="btn btn-light btn-sm" type="button" onClick={() => onQuote(a, z)}>
        {soon ? 'Ask about' : 'Quote'} {hubName(a)} to {hubName(z)}
      </button>
    </>
  );
}
