/*
 * Every page except Home. Each one is a page banner (breadcrumb, title, intro)
 * followed by the section that holds the content.
 */
import { PageHeader } from '../components/PageHeader';
import { CtaBand } from '../components/CtaBand';
import { Link, type Route } from '../lib/router';
import { COMPANY } from '../config';
import { About } from '../sections/About';
import { Contact } from '../sections/Contact';
import { Faq } from '../sections/Faq';
import { Fleet } from '../sections/Fleet';
import { Process } from '../sections/Process';
import { QuoteSection } from '../sections/QuoteSection';
import { Reviews } from '../sections/Reviews';
import { RoutesSection } from '../sections/RoutesSection';
import { ServiceDetails } from '../sections/ServiceDetails';
import { TrackSection } from '../sections/TrackSection';

function Jump({ items }: { items: [string, Route][] }) {
  return (
    <nav className="jump" aria-label="On this page">
      {items.map(([label, to]) => <Link key={label} to={to}>{label}</Link>)}
    </nav>
  );
}

export function ServicesPage() {
  const s = (anchor: string): Route => ({ page: 'services', anchor });
  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Services' }]}
        eyebrow="Services"
        title="Trucking for every kind of load"
        lede="Chilled, frozen or dry, one pallet or a full truck. We move all kinds of goods across Zambia, with South Africa coming soon."
      >
        <Jump items={[['Refrigerated', s('refrigerated')], ['Containerised', s('containerised')], ['Truck hire', s('truck-hire')], ['Across Zambia', s('zambia')], ['South Africa', s('south-africa')]]} />
      </PageHeader>
      <ServiceDetails />
      <Process />
      <CtaBand />
    </>
  );
}

export function RoutesPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Routes' }]}
        eyebrow="Routes · Zambia"
        title="Where we run"
        lede="Across Zambia, from the Copperbelt to Livingstone and from Mongu to Chipata. Trips to Limpopo, Pretoria and Johannesburg are coming soon. Pick a route, or click any town on the map."
      />
      <RoutesSection head={false} />
      <CtaBand title="Moving goods on one of these routes?" />
    </>
  );
}

export function FleetPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Fleet' }]}
        eyebrow="Fleet"
        title="The trucks"
        lede="Refrigerated and containerised trucks from 2 to 5 tonnes, kept in excellent condition and driven by experienced, licensed drivers. If a truck develops a problem while loaded, another truck from our fleet takes over."
      />
      <Fleet head={false} />
      <CtaBand title="Not sure which truck you need?" text="Tell us what you are moving and how much of it. We will match the load to the right truck." />
    </>
  );
}

export function AboutPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: 'About us' }]}
        eyebrow="About us"
        title="Started by a father, run by a family"
        lede={`${COMPANY.name} has been on the road since ${COMPANY.founded}. This is how it began, and the people who keep it moving.`}
      >
        <Jump items={[['Our story', { page: 'about', anchor: 'story' }], ['Our team', { page: 'about', anchor: 'team' }], ['Reviews', { page: 'reviews' }], ['FAQ', { page: 'faq' }]]} />
      </PageHeader>
      <About head={false} />
      <CtaBand title="Work with a family that treats you like family" />
    </>
  );
}

export function ReviewsPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: 'About us', to: { page: 'about' } }, { label: 'Reviews' }]}
        eyebrow="Reviews"
        title="What customers say"
        lede="Reviews from customers we have delivered for. Our team checks each one before it appears, so what you read here is real."
      />
      <Reviews head={false} />
    </>
  );
}

export function FaqPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: 'About us', to: { page: 'about' } }, { label: 'FAQ' }]}
        eyebrow="FAQ"
        title="Questions shippers ask"
        lede={<>Rates, trucks, insurance, tracking and timing. Anything else, <Link to={{ page: 'contact' }}>send us a message</Link> and we will answer the same way we answer quotes.</>}
      />
      <Faq head={false} />
      <CtaBand />
    </>
  );
}

export function QuotePage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Get a quote' }]}
        eyebrow="Quote"
        title="Get a quote"
        lede="Tell us what is moving, from where to where, and when. The more we know about the load, the faster and more accurate the rate. Fields marked * are required."
      />
      <QuoteSection head={false} />
    </>
  );
}

export function TrackPage({ track }: { track?: string }) {
  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Track a load' }]}
        eyebrow="Tracking"
        title="Track a load"
        lede="Enter the reference from your booking confirmation. Status is updated by our operations team as the truck moves."
      />
      <TrackSection head={false} deepLink={track} />
    </>
  );
}

export function ContactPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Contact' }]}
        eyebrow="Contact"
        title="Talk to us"
        lede="WhatsApp is the fastest way to reach us, from Zambia or anywhere on the road. You can also call, email the details of your load, or find us at our pin off Great East Road."
      />
      <Contact head={false} />
    </>
  );
}
