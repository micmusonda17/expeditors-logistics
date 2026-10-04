import { useEffect, useId, useRef, useState } from 'react';
import { Link, asset, type PageKey, type Route } from '../lib/router';
import { IconChevron, IconMenu, IconX } from './Icons';

interface SubItem { label: string; desc?: string; to: Route }
interface NavItem { label: string; to: Route; pages: PageKey[]; children?: SubItem[] }

// The main menu. Add, remove or rename tabs here. An item with `children` gets a dropdown,
// and `pages` says which pages underline that tab as the current one.
export const NAV: NavItem[] = [
  { label: 'Home', to: { page: 'home' }, pages: ['home'] },
  {
    label: 'Services', to: { page: 'services' }, pages: ['services'],
    children: [
      { label: 'All services', desc: 'Everything we do, in one place', to: { page: 'services' } },
      { label: 'Refrigerated transport', desc: 'Chilled and frozen, 3 to 5 t', to: { page: 'services', anchor: 'refrigerated' } },
      { label: 'Containerised transport', desc: 'Closed trucks for dry goods, 2 and 3 t', to: { page: 'services', anchor: 'containerised' } },
      { label: 'Dedicated truck hire', desc: 'By the day or month, with a driver', to: { page: 'services', anchor: 'truck-hire' } },
      { label: 'Across Zambia', desc: 'Lusaka, the Copperbelt and the provinces', to: { page: 'services', anchor: 'zambia' } },
      { label: 'South Africa', desc: 'Coming soon', to: { page: 'services', anchor: 'south-africa' } }
    ]
  },
  { label: 'Routes', to: { page: 'routes' }, pages: ['routes'] },
  { label: 'Fleet', to: { page: 'fleet' }, pages: ['fleet'] },
  {
    label: 'About', to: { page: 'about' }, pages: ['about', 'reviews', 'faq'],
    children: [
      { label: 'Our story', desc: 'How a family business began', to: { page: 'about', anchor: 'story' } },
      { label: 'Our team', desc: 'The people behind every load', to: { page: 'about', anchor: 'team' } },
      { label: 'Reviews', desc: 'What customers say', to: { page: 'reviews' } },
      { label: 'FAQ', desc: 'Questions shippers ask', to: { page: 'faq' } }
    ]
  },
  { label: 'Track', to: { page: 'track' }, pages: ['track'] },
  { label: 'Contact', to: { page: 'contact' }, pages: ['contact'] }
];

// One dropdown menu (Services or About). Opens on hover on a computer, on tap on a phone,
// and closes on a click outside or the Escape key.
function Dropdown({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate(): void }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); ref.current?.querySelector('button')?.focus(); } };
    document.addEventListener('pointerdown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Hover opens the menu on computers with a mouse; click and keyboard work everywhere.
  const hoverOpen = (v: boolean) => {
    if (!window.matchMedia('(hover: hover) and (min-width: 1061px)').matches) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(v), v ? 60 : 200);
  };
  const close = () => { setOpen(false); onNavigate(); };

  return (
    <div className={'nav-item has-dd' + (open ? ' open' : '')} ref={ref} onMouseEnter={() => hoverOpen(true)} onMouseLeave={() => hoverOpen(false)}>
      <button type="button" className={'nav-link' + (active ? ' active' : '')} aria-expanded={open} aria-controls={id} onClick={() => setOpen(o => !o)}>
        {item.label}<IconChevron className="chev" />
      </button>
      <div className="dd" id={id} role="group" aria-label={item.label}>
        <ul>
          {item.children!.map(c => (
            <li key={c.label}>
              <Link to={c.to} onClick={close}><b>{c.label}</b>{c.desc && <span>{c.desc}</span>}</Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// The bar at the top of every page: logo, menu and the Get a quote button.
// On screens under 1060px wide the menu folds into the button with three lines.
export function Header({ current }: { current: Route }) {
  const [open, setOpen] = useState(false);
  const page = current.page === 'admin' ? 'home' : current.page;

  // Close the phone menu whenever the page changes.
  useEffect(() => { setOpen(false); }, [current]);
  useEffect(() => {
    document.body.classList.toggle('menu-open', open);
    return () => document.body.classList.remove('menu-open');
  }, [open]);

  const close = () => setOpen(false);
  return (
    <header className={'site-header' + (open ? ' open' : '')}>
      <div className="wrap">
        <Link className="brand" to={{ page: 'home' }} aria-label="Expeditors Logistics Limited, home" onClick={close}>
          <img className="word" src={asset('assets/img/wordmark.png')} alt="Expeditors" width={998} height={102} />
          <img className="tag" src={asset('assets/img/tagline.png')} alt="Logistics Limited" width={762} height={50} />
        </Link>
        <button className="menu-btn" aria-expanded={open} aria-controls="nav" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(o => !o)}>
          {open ? <IconX /> : <IconMenu />}
        </button>
        <nav className="nav" id="nav" aria-label="Main">
          {NAV.map(item => {
            const active = item.pages.includes(page as PageKey);
            return item.children
              ? <Dropdown key={item.label} item={item} active={active} onNavigate={close} />
              : (
                <div className="nav-item" key={item.label}>
                  <Link className={'nav-link' + (active ? ' active' : '')} to={item.to} onClick={close} aria-current={active ? 'page' : undefined}>{item.label}</Link>
                </div>
              );
          })}
          <Link className="btn btn-red nav-cta" to={{ page: 'quote' }} onClick={close}>Get a quote</Link>
        </nav>
        <Link className="btn btn-red btn-sm header-cta" to={{ page: 'quote' }}>Get a quote</Link>
      </div>
    </header>
  );
}
