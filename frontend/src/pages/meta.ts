import type { PageKey } from '../lib/router';

/** Browser tab title and search-engine description for every page. */
export const PAGE_META: Record<PageKey, { title: string; description: string }> = {
  home: {
    title: 'Expeditors Logistics | Refrigerated and containerised trucking in Zambia',
    description: 'Family-owned trucking company in Lusaka since 2017. Refrigerated and containerised trucks from 2 to 5 tonnes, delivering all kinds of goods across Zambia.'
  },
  services: {
    title: 'Services | Expeditors Logistics',
    description: 'Refrigerated transport, containerised transport and dedicated truck hire across Zambia. South Africa coming soon.'
  },
  routes: {
    title: 'Routes | Expeditors Logistics',
    description: 'Where we run: Lusaka, the Copperbelt and the provinces of Zambia. Trips to Limpopo, Pretoria and Johannesburg coming soon.'
  },
  fleet: {
    title: 'Fleet | Expeditors Logistics',
    description: 'Refrigerated trucks from 3 to 5 tonnes and containerised trucks of 2 and 3 tonnes, kept in excellent condition.'
  },
  about: {
    title: 'About us | Expeditors Logistics',
    description: 'A family trucking business founded in Lusaka in 2017 by Michael Musonda Sr. Meet the family behind every load.'
  },
  reviews: {
    title: 'Reviews | Expeditors Logistics',
    description: 'Read what customers say about Expeditors Logistics, or leave a review of your own delivery.'
  },
  faq: {
    title: 'FAQ | Expeditors Logistics',
    description: 'Answers to the questions shippers ask about rates, trucks, insurance, tracking and delivery times.'
  },
  quote: {
    title: 'Get a quote | Expeditors Logistics',
    description: 'Request a trucking quote for your load. We reply with a rate and the truck that fits.'
  },
  track: {
    title: 'Track a load | Expeditors Logistics',
    description: 'Enter your load reference to see where your goods are, with every update from our operations team.'
  },
  contact: {
    title: 'Contact | Expeditors Logistics',
    description: 'Call, WhatsApp or email Expeditors Logistics. 14139/M Ndeke Farms, Off Great East Road, Lusaka.'
  }
};
