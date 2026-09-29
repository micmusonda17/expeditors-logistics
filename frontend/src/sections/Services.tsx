import type { ComponentType } from 'react';
import { Link } from '../lib/router';
import { IconArrow, IconCalendar, IconClock, IconPin, IconRoad, IconSnow, IconTown } from '../components/Icons';

interface Service { icon: ComponentType; title: string; text: string; tags: string[]; soon?: boolean; more: { page: 'services' | 'fleet' | 'routes'; anchor?: string } }

const SERVICES: Service[] = [
  { icon: IconSnow, title: 'Refrigerated transport', text: 'Chilled and frozen food such as poultry, meat and dairy, moved at a controlled temperature in our 3 to 5 t refrigerated trucks.', tags: ['Chilled', 'Frozen', 'Food safe'], more: { page: 'services', anchor: 'refrigerated' } },
  { icon: IconCalendar, title: 'Dedicated truck hire', text: 'Hire a truck with a driver by the day or on a monthly contract. Rates cover the truck, the driver and routine maintenance.', tags: ['Daily', 'Monthly', 'With driver'], more: { page: 'services', anchor: 'truck-hire' } },
  { icon: IconRoad, title: 'Across Zambia', text: 'Loads between Lusaka, the Copperbelt and the provincial towns: Livingstone, Chipata, Kasama, Mongu and Solwezi.', tags: ['Lusaka', 'Copperbelt', 'Provinces'], more: { page: 'services', anchor: 'zambia' } },
  { icon: IconTown, title: 'Lusaka deliveries', text: 'Quick runs around Lusaka and nearby towns in our 2 and 3 t containerised trucks, closed and lockable so dry goods arrive clean and on time.', tags: ['Same town', 'Containerised', 'On time'], more: { page: 'services', anchor: 'containerised' } },
  { icon: IconPin, title: 'Tracked and backed up', text: 'GPS tracking on the road, a backup truck from our own fleet if anything goes wrong while loaded, and goods-in-transit insurance for contract work.', tags: ['GPS', 'Backup truck', 'Insurance'], more: { page: 'fleet' } },
  { icon: IconClock, title: 'South Africa', text: 'Coming soon: trips from Zambia to Limpopo, Pretoria and Johannesburg. Tell us about your loads and we will let you know when we start.', tags: ['Coming soon', 'Limpopo', 'Gauteng'], soon: true, more: { page: 'services', anchor: 'south-africa' } }
];

export function Services({ head = true }: { head?: boolean } = {}) {
  return (
    <section className="section" id="services" aria-labelledby={head ? 'services-title' : undefined}>
      <div className="wrap">
        {head && (
          <div className="section-head">
            <div>
              <p className="eyebrow">Services</p>
              <h2 id="services-title" className="display">What we haul</h2>
            </div>
            <p className="lede">All kinds of goods, chilled, frozen or dry, one customer per truck. Tell us what is moving and where, and we match the right truck to the load.</p>
          </div>
        )}
        <div className="services-grid">
          {SERVICES.map(({ icon: Icon, title, text, tags, soon, more }) => (
            <article className={'service' + (soon ? ' soon' : '')} key={title}>
              <div className="ico"><Icon /></div>
              <h3>{title}</h3>
              <p>{text}</p>
              <div className="tags">{tags.map(t => <span key={t}>{t}</span>)}</div>
              <Link className="more-link" to={more} aria-label={`More about ${title.toLowerCase()}`}>Learn more <IconArrow /></Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
