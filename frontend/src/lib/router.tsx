/*
 * Small client-side router for the multi-page site.
 *
 * Two URL styles, same pages:
 *   path mode (default, used on the live site, in Docker and on GitHub Pages)
 *     /services   /services#refrigerated   /track/ELL-7K3Q9   /admin/quotes
 *   hash mode (VITE_ROUTER=hash, for hosts that only allow plain #hashes)
 *     #services   #services--refrigerated  #track-ELL-7K3Q9   #admin-quotes
 *
 * The host must send every unknown path to index.html in path mode:
 * nginx (try_files), Render (rewrite rule) and GitHub Pages (404.html copy) are set up for this.
 */
import { useEffect, useState, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from 'react';

export const PAGES = ['home', 'services', 'routes', 'fleet', 'about', 'reviews', 'faq', 'quote', 'track', 'contact'] as const;
export type PageKey = (typeof PAGES)[number];
export type AdminView = 'dash' | 'quotes' | 'loads' | 'reviews';

export type Route =
  | { page: 'admin'; view: AdminView }
  | { page: PageKey; anchor?: string; track?: string };

export const ROUTER_MODE: 'path' | 'hash' = import.meta.env.VITE_ROUTER === 'hash' ? 'hash' : 'path';

// Vite's base: '/' in Docker and on Render, '/<repo>/' on GitHub Pages, './' for single-file previews.
const BASE = (() => {
  const b = import.meta.env.BASE_URL || '/';
  return b.endsWith('/') ? b : b + '/';
})();

/** URL for a file in frontend/public, e.g. asset('assets/img/logo.png'). Works on every page depth. */
export const asset = (path: string) => (/^(https?:)?\/\//.test(path) ? path : BASE + path.replace(/^\//, ''));

const ADMIN_VIEWS: AdminView[] = ['dash', 'quotes', 'loads', 'reviews'];
const isPage = (s: string): s is PageKey => (PAGES as readonly string[]).includes(s);

function parseHashStyle(h: string): Route | null {
  h = decodeURIComponent(h.replace(/^#/, ''));
  if (h === 'admin' || h.startsWith('admin-')) {
    const v = h.slice(6) as AdminView;
    return { page: 'admin', view: ADMIN_VIEWS.includes(v) ? v : 'dash' };
  }
  if (h.startsWith('track-')) return { page: 'track', track: h.slice(6) };
  const [page, anchor] = h.split('--');
  if (isPage(page)) return { page, anchor: anchor || undefined };
  return null;
}

export function parseLocation(loc: Location = location): Route {
  if (ROUTER_MODE === 'hash') return parseHashStyle(loc.hash) ?? { page: 'home', anchor: loc.hash.slice(1) || undefined };

  let path = decodeURIComponent(loc.pathname);
  const baseAbs = BASE.startsWith('.') ? '/' : BASE;
  if (path.startsWith(baseAbs)) path = path.slice(baseAbs.length);
  const parts = path.split('/').filter(Boolean);
  const hash = loc.hash.replace(/^#/, '');

  if (!parts.length) {
    // Old one-page links such as /#track-ELL-XXXX or /#quote keep working.
    const legacy = hash ? parseHashStyle(hash) : null;
    if (legacy && !(legacy.page === 'home')) return legacy;
    return { page: 'home', anchor: hash || undefined };
  }
  if (parts[0] === 'admin') {
    const v = (parts[1] || 'dash') as AdminView;
    return { page: 'admin', view: ADMIN_VIEWS.includes(v) ? v : 'dash' };
  }
  if (parts[0] === 'track') return { page: 'track', track: parts[1] };
  if (isPage(parts[0])) return { page: parts[0], anchor: hash || undefined };
  return { page: 'home' };
}

export function href(r: Route): string {
  if (ROUTER_MODE === 'hash') {
    if (r.page === 'admin') return r.view === 'dash' ? '#admin' : `#admin-${r.view}`;
    if (r.page === 'track' && r.track) return `#track-${r.track}`;
    if (r.page === 'home') return r.anchor ? `#home--${r.anchor}` : '#home';
    return `#${r.page}${r.anchor ? `--${r.anchor}` : ''}`;
  }
  const root = BASE.startsWith('.') ? '/' : BASE;
  if (r.page === 'admin') return root + (r.view === 'dash' ? 'admin' : `admin/${r.view}`);
  if (r.page === 'track' && r.track) return `${root}track/${encodeURIComponent(r.track)}`;
  const path = r.page === 'home' ? root : root + r.page;
  return path + (r.anchor ? `#${r.anchor}` : '');
}

/** Absolute URL, for links sent to customers (tracking links on WhatsApp or email). */
export function absoluteHref(r: Route, siteUrl?: string): string {
  const h = href(r);
  if (siteUrl) {
    const origin = siteUrl.replace(/\/$/, '');
    if (ROUTER_MODE === 'hash') return `${origin}/${h}`;
    return origin + h.slice(BASE.startsWith('.') ? 1 : BASE.length - 1);
  }
  if (ROUTER_MODE === 'hash') return location.href.split('#')[0] + h;
  return location.origin + h;
}

const EVENT = 'ell:navigate';

export function navigate(to: Route | string, opts: { replace?: boolean } = {}) {
  const url = typeof to === 'string' ? to : href(to);
  if (ROUTER_MODE === 'hash') {
    if (opts.replace) location.replace(url.startsWith('#') ? url : '#' + url);
    else location.hash = url;
    return;
  }
  if (opts.replace) history.replaceState(null, '', url);
  else history.pushState(null, '', url);
  window.dispatchEvent(new Event(EVENT));
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseLocation());
  useEffect(() => {
    const on = () => setRoute(parseLocation());
    window.addEventListener('popstate', on);
    window.addEventListener('hashchange', on);
    window.addEventListener(EVENT, on);
    return () => {
      window.removeEventListener('popstate', on);
      window.removeEventListener('hashchange', on);
      window.removeEventListener(EVENT, on);
    };
  }, []);
  return route;
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: Route; children: ReactNode };

/** In-site link. Keeps normal link behaviour (new tab, copy link) and navigates without a reload. */
export function Link({ to, onClick, children, ...rest }: LinkProps) {
  const url = href(to);
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || rest.target === '_blank') return;
    if (ROUTER_MODE === 'hash') {
      // Clicking the link of the page you are on fires no hashchange: nudge the router so it scrolls again.
      if (location.hash === url) { e.preventDefault(); window.dispatchEvent(new Event(EVENT)); }
      return;
    }
    e.preventDefault();
    // Same address: replace instead of adding a history entry. navigate() re-renders and scrolls either way.
    navigate(url, { replace: url === location.pathname + location.hash });
  };
  return <a href={url} onClick={handle} {...rest}>{children}</a>;
}
