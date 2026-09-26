import { COUNTRIES, HUBS, hubName } from '../lib/network';
import { COMPANY } from '../config';

type LaneLike = { fromHub?: string; toHub?: string; pickup?: string; delivery?: string; origin?: string; destination?: string };
export const laneOf = (x: LaneLike) =>
  `${x.fromHub ? hubName(x.fromHub) : (x.pickup || x.origin || '').split(',')[0]} → ${x.toHub ? hubName(x.toHub) : (x.delivery || x.destination || '').split(',')[0]}`;

export const phoneCountry = (hub?: string): 'ZM' | 'ZA' => (hub && HUBS[hub]?.country === 'ZA' ? 'ZA' : 'ZM');

export function HubOptions() {
  return (
    <>
      {Object.keys(COUNTRIES).map(c => {
        const ks = Object.keys(HUBS).filter(k => HUBS[k].country === c).sort((a, b) => hubName(a).localeCompare(hubName(b)));
        return ks.length ? <optgroup key={c} label={COUNTRIES[c]}>{ks.map(k => <option key={k} value={k}>{hubName(k)}</option>)}</optgroup> : null;
      })}
    </>
  );
}

export const CurrencyOptions = () => <>{COMPANY.currencies.map(c => <option key={c}>{c}</option>)}</>;
