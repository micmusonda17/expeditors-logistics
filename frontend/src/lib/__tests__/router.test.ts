import { describe, expect, it } from 'vitest';
import { absoluteHref, href, parseLocation, type Route } from '../router';

const at = (pathname: string, hash = '') => parseLocation({ pathname, hash } as Location);

describe('router (page addresses)', () => {
  it('reads page addresses', () => {
    expect(at('/')).toEqual({ page: 'home', anchor: undefined });
    expect(at('/services')).toEqual({ page: 'services', anchor: undefined });
    expect(at('/services/', '#refrigerated')).toEqual({ page: 'services', anchor: 'refrigerated' });
    expect(at('/about', '#team')).toEqual({ page: 'about', anchor: 'team' });
    expect(at('/track/ELL-7K3Q9')).toEqual({ page: 'track', track: 'ELL-7K3Q9' });
    expect(at('/admin')).toEqual({ page: 'admin', view: 'dash' });
    expect(at('/admin/reviews')).toEqual({ page: 'admin', view: 'reviews' });
    expect(at('/nowhere')).toEqual({ page: 'home' });
  });

  it('keeps old one-page links working', () => {
    expect(at('/', '#track-ELL-7K3Q9')).toEqual({ page: 'track', track: 'ELL-7K3Q9' });
    expect(at('/', '#admin-quotes')).toEqual({ page: 'admin', view: 'quotes' });
    expect(at('/', '#quote')).toEqual({ page: 'quote', anchor: undefined });
  });

  it('builds addresses that read back to the same page', () => {
    const routes: Route[] = [
      { page: 'home' }, { page: 'services', anchor: 'truck-hire' }, { page: 'reviews' },
      { page: 'track', track: 'ELL-7K3Q9' }, { page: 'admin', view: 'dash' }, { page: 'admin', view: 'loads' }
    ];
    for (const r of routes) {
      const url = new URL(href(r), 'https://example.com');
      expect(at(url.pathname, url.hash)).toMatchObject(r);
    }
    expect(href({ page: 'services', anchor: 'refrigerated' })).toBe('/services#refrigerated');
  });

  it('makes absolute tracking links', () => {
    expect(absoluteHref({ page: 'track', track: 'ELL-1' }, 'https://expeditorsafrica.com/')).toBe('https://expeditorsafrica.com/track/ELL-1');
  });
});
