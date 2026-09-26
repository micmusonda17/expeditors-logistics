import { useEffect, useState } from 'react';

/**
 * Hash routing that also works on any static host (no server rewrites needed):
 *   #admin, #admin-quotes, #admin-loads, #admin-reviews   operations portal
 *   #track-ELL-XXXXX                      public tracking deep link
 *   anything else                         a section of the public site
 */
export type HashRoute =
  | { page: 'admin'; view: 'dash' | 'quotes' | 'loads' | 'reviews' }
  | { page: 'site'; track?: string; section?: string };

export function parseHash(hash: string): HashRoute {
  const h = decodeURIComponent(hash.replace(/^#/, ''));
  if (h === 'admin' || h.startsWith('admin-')) {
    const view = h === 'admin-quotes' ? 'quotes' : h === 'admin-loads' ? 'loads' : h === 'admin-reviews' ? 'reviews' : 'dash';
    return { page: 'admin', view };
  }
  if (h.startsWith('track-')) return { page: 'site', track: h.slice(6) };
  return { page: 'site', section: h || undefined };
}

export function useHashRoute(): HashRoute {
  const [route, setRoute] = useState(() => parseHash(location.hash));
  useEffect(() => {
    const on = () => setRoute(parseHash(location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
