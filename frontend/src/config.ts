/* =====================================================================
   EXPEDITORS LOGISTICS LIMITED: COMPANY DETAILS
   Edit these values and the whole site updates.
   ===================================================================== */
export const COMPANY = {
  name: 'Expeditors Logistics Limited',
  shortName: 'Expeditors Logistics',
  director: 'Michael Musonda Sr.',
  founded: 2017,
  location: '14139/M Ndeke Farms, Off Great East Road, Lusaka, Zambia',
  // Google Maps link to the exact pin (Share > Copy link in Google Maps). Empty: search by address.
  mapsUrl: '',

  phones: [
    { display: '+260 97 271 5121', dial: '+260972715121' },
    { display: '+260 57 240 3698', dial: '+260572403698' }
  ],
  // Digits only with country code. CONFIRM which number has WhatsApp.
  whatsapp: '260972715121',
  // Main company inbox: the only address on the
  // Contact section and the one quote requests are emailed to.
  email: 'expeditorsafrica@gmail.com',
  // Shown on the Contact section only if the company inbox above is left empty.
  fallbackEmails: ['michaelmusonda71@gmail.com', 'maibalombe@yahoo.com'],

  // Public address of the site, used in tracking links sent to customers.
  // Leave empty to use whatever address the site is opened on.
  siteUrl: '',

  currencies: ['ZMW', 'USD', 'ZAR'] as const,
  // Show the ELL-SAMPLE shipment in the public tracker.
  showSampleShipment: true
};

export type Currency = (typeof COMPANY.currencies)[number];

export const CONTACT_EMAILS: string[] = COMPANY.email ? [COMPANY.email] : COMPANY.fallbackEmails;

/* ---------------------------------------------------------------------
   ABOUT OUR TEAM
   photo: put the picture in frontend/public/assets/img/team/ and give its
   path, e.g. 'assets/img/team/mutale.jpg'. Head-and-shoulders crop,
   640 x 704 px (10:11), face in the upper half.
   Leave photo, email or phone out and that part is not shown.
   whatsapp: true adds a WhatsApp button for the phone number.
   --------------------------------------------------------------------- */
export interface TeamMember {
  name: string;
  role: string;
  /** Optional second role, shown under the main one. */
  alsoRole?: string;
  bio: string;
  photo?: string;
  email?: string;
  /** With country code, e.g. '+260 97 000 0000'. */
  phone?: string;
  /** The phone number above is on WhatsApp. */
  whatsapp?: boolean;
  founder?: boolean;
}

export const TEAM: TeamMember[] = [
  {
    name: 'Michael Musonda Sr.',
    role: 'Founder and Managing Director',
    founder: true,
    bio: `Founded Expeditors Logistics in ${COMPANY.founded} and leads the company, its customers and its contracts.`,
    photo: 'assets/img/team/michael-sr.jpg',
    email: 'michaelmusonda71@gmail.com',
    phone: '+260 57 240 3698',
    whatsapp: true
  },
  {
    name: 'Lombe Maiba Musonda',
    role: 'Deputy Managing Director',
    bio: 'Works alongside the Managing Director to run the business day to day and keep every load on schedule.',
    photo: 'assets/img/team/lombe.jpg',
    email: 'maibalombe@yahoo.com',
    phone: '+260 97 520 3889',
    whatsapp: true
  },
  {
    name: 'Mutale Musonda',
    role: 'Head of Sales and Advertising',
    alsoRole: 'Technical Operations Lead',
    bio: 'Looks after our customers and advertising, and runs the systems behind quotes, bookings and load tracking.',
    photo: 'assets/img/team/mutale.jpg',
    phone: '+260 97 361 7177',
    whatsapp: true
  },
  {
    name: 'Michael Musonda',
    role: 'Head Developer',
    bio: 'Builds and runs the company website, the operations portal and online load tracking.',
    photo: 'assets/img/team/michael.jpg',
    phone: '+27 74 705 7798',
    whatsapp: true
  }
];

// `vite --mode demo` (npm run dev:demo / build:demo) or VITE_API_MODE=demo switch to the in-browser sample backend.
export const API_MODE: 'live' | 'demo' = import.meta.env.MODE === 'demo' || import.meta.env.VITE_API_MODE === 'demo' ? 'demo' : 'live';
export const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
export const IS_DEMO = API_MODE === 'demo';
