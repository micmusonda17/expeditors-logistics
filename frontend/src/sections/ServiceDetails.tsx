import type { ComponentType, ReactNode } from 'react';
import { LANES, hubName, routeBetween } from '../lib/network';
import { fmt } from '../lib/format';
import { Link, type Route } from '../lib/router';
import { TruckArt } from '../components/TruckArt';
import { IconArrow, IconCalendar, IconCheck, IconClock, IconRoad } from '../components/Icons';

interface Detail {
  id: string;
  eyebrow: string;
  title: string;
  intro: string;
  points: string[];
  art: ReactNode;
  cta: { label: string; to: Route };
  soon?: boolean;
}

const Art = ({ icon: Icon }: { icon: ComponentType }) => <div className="sd-icon"><Icon /></div>;

function LaneList({ soon }: { soon: boolean }) {
  const lanes = LANES.filter(l => !!l.soon === soon).map(l => ({ ...l, km: routeBetween(l.from, l.to)?.best.km })).filter(l => l.km);
  return (
    <ul className="sd-lanes">
      {lanes.map(l => (
        <li key={l.from + l.to}><b>{hubName(l.from)}</b> <span aria-hidden>→</span> <b>{hubName(l.to)}</b><span className="num">≈{fmt(l.km!)} km</span></li>
      ))}
    </ul>
  );
}

const DETAILS: (Detail & { extra?: ReactNode })[] = [
  {
    id: 'refrigerated',
    eyebrow: 'Chilled and frozen',
    title: 'Refrigerated transport',
    intro: 'Insulated trucks with refrigeration units keep chilled and frozen products at a controlled temperature from pickup to delivery.',
    points: ['Refrigerated trucks from 3 to 5 tonnes', 'Poultry, meat, dairy, frozen food and other perishables', 'Real-time GPS on the road', 'One customer per truck, loaded and sealed at your site'],
    art: <TruckArt kind="reefer" />,
    cta: { label: 'Quote a chilled load', to: { page: 'quote' } }
  },
  {
    id: 'containerised',
    eyebrow: 'Dry goods',
    title: 'Containerised transport',
    intro: 'Closed, lockable cargo boxes keep dry goods out of the sun, rain and dust, for town deliveries and runs between provinces.',
    points: ['Containerised trucks of 2 and 3 tonnes', 'Groceries, beverages, bagged and packaged goods', 'Quick runs around Lusaka and nearby towns', 'Longer runs to the Copperbelt and the provinces'],
    art: <TruckArt kind="box" />,
    cta: { label: 'Quote a dry load', to: { page: 'quote' } }
  },
  {
    id: 'truck-hire',
    eyebrow: 'By the day or month',
    title: 'Dedicated truck hire',
    intro: 'Hire a truck with an experienced, licensed driver on a daily or monthly contract, for regular deliveries without the cost of your own fleet.',
    points: ['Rates cover the truck, the driver and routine maintenance', 'Fuel arrangements agreed in the contract', 'Goods-in-transit insurance from the day the contract is signed', 'A backup truck from our fleet if one develops a problem'],
    art: <Art icon={IconCalendar} />,
    cta: { label: 'Ask about truck hire', to: { page: 'quote' } }
  },
  {
    id: 'zambia',
    eyebrow: 'Across Zambia',
    title: 'Routes we run',
    intro: 'Loads between Lusaka, the Copperbelt and the provincial towns. Other towns are fine too: tell us where and we will route it.',
    points: [],
    art: <Art icon={IconRoad} />,
    cta: { label: 'Open the route map', to: { page: 'routes' } },
    extra: <LaneList soon={false} />
  },
  {
    id: 'south-africa',
    eyebrow: 'Coming soon',
    title: 'South Africa',
    intro: 'We are preparing trips from Zambia to Limpopo, Pretoria and Johannesburg. Send us your loads now and we will let you know as soon as we start.',
    points: [],
    art: <Art icon={IconClock} />,
    cta: { label: 'Register a South Africa load', to: { page: 'quote' } },
    extra: <LaneList soon />,
    soon: true
  }
];

export function ServiceDetails() {
  return (
    <section className="section service-details" aria-label="Our services in detail">
      <div className="wrap">
        {DETAILS.map((d, i) => (
          <article className={'sd' + (i % 2 ? ' flip' : '') + (d.soon ? ' soon' : '')} id={d.id} key={d.id}>
            <div className="sd-art">{d.art}</div>
            <div className="sd-body">
              <p className="eyebrow">{d.eyebrow}</p>
              <h2 className="display">{d.title}</h2>
              <p className="sd-intro">{d.intro}</p>
              {d.points.length > 0 && (
                <ul className="sd-points">{d.points.map(p => <li key={p}><IconCheck />{p}</li>)}</ul>
              )}
              {d.extra}
              <Link className="btn btn-ghost btn-sm" to={d.cta.to}>{d.cta.label} <IconArrow /></Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
