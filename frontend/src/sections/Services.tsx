import type { ComponentType } from 'react';
import { IconCalendar, IconClock, IconPin, IconRoad, IconSnow, IconTown } from '../components/Icons';

interface Service { icon: ComponentType; title: string; text: string; tags: string[]; soon?: boolean }

const SERVICES: Service[] = [
  { icon: IconSnow, title: 'Refrigerated transport', text: 'Chilled and frozen food such as poultry, meat and dairy, moved at a controlled temperature in our 3 to 5 t refrigerated trucks.', tags: ['Chilled', 'Frozen', 'Food safe'] },
  { icon: IconCalendar, title: 'Dedicated truck hire', text: 'Hire a truck with a driver by the day or on a monthly contract. Rates cover the truck, the driver and routine maintenance.', tags: ['Daily', 'Monthly', 'With driver'] },
  { icon: IconRoad, title: 'Across Zambia', text: 'Loads between Lusaka, the Copperbelt and the provincial towns: Livingstone, Chipata, Kasama, Mongu and Solwezi.', tags: ['Lusaka', 'Copperbelt', 'Provinces'] },
  { icon: IconTown, title: 'Lusaka deliveries', text: 'Quick runs around Lusaka and nearby towns in our 2 and 3 t containerised trucks, closed and lockable so dry goods arrive clean and on time.', tags: ['Same town', 'Containerised', 'On time'] },
  { icon: IconPin, title: 'Tracked and backed up', text: 'GPS tracking on the road, a backup truck from our own fleet if anything goes wrong while loaded, and goods-in-transit insurance for contract work.', tags: ['GPS', 'Backup truck', 'Insurance'] },
  { icon: IconClock, title: 'South Africa', text: 'Coming soon: trips from Zambia to Limpopo, Pretoria and Johannesburg. Tell us about your loads and we will let you know when we start.', tags: ['Coming soon', 'Limpopo', 'Gauteng'], soon: true }
];

export function Services() {
  return (
    <section className="section" id="services" aria-labelledby="services-title">
      <div className="wrap">
        <div className="section-head">
          <div>
            <p className="eyebrow">Services</p>
            <h2 id="services-title" className="display">What we haul</h2>
          </div>
          <p className="lede">All kinds of goods, chilled, frozen or dry, one customer per truck. Tell us what is moving and where, and we match the right truck to the load.</p>
        </div>
        <div className="services-grid">
          {SERVICES.map(({ icon: Icon, title, text, tags, soon }) => (
            <article className={'service' + (soon ? ' soon' : '')} key={title}>
              <div className="ico"><Icon /></div>
              <h3>{title}</h3>
              <p>{text}</p>
              <div className="tags">{tags.map(t => <span key={t}>{t}</span>)}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
