import { describe as suite, expect, it } from 'vitest';
import { describe, hubTier, isPublicHub, matchHub, pathFromNodes, routeBetween, CORRIDORS } from '../network';

suite('route network', () => {
  it('finds the same distances as the backend', () => {
    expect(routeBetween('lusaka', 'kitwe')?.best.km).toBe(380);
    expect(routeBetween('lusaka', 'johannesburg')?.best.km).toBe(1600);
    const r = routeBetween('lusaka', 'polokwane')!.best;
    expect(describe(r).borders).toEqual(['chirundu', 'beitbridge']);
  });

  it('offers the Botswana route as an alternative to Johannesburg', () => {
    const r = routeBetween('lusaka', 'johannesburg')!;
    expect(r.alt?.km).toBe(1850);
  });

  it('every corridor is a connected path', () => {
    for (const c of CORRIDORS) expect(pathFromNodes(c.path), c.id).not.toBeNull();
  });

  it('matches typed town names and aliases', () => {
    expect(matchHub('Kitwe, Zambia')).toBe('kitwe');
    expect(matchHub('jhb')).toBe('johannesburg');
    expect(matchHub('Atlantis')).toBeNull();
  });

  it('only offers Zambia and the South African towns that are coming soon', () => {
    expect(isPublicHub('lusaka')).toBe(true);
    expect(isPublicHub('polokwane')).toBe(true);
    expect(isPublicHub('dar')).toBe(false);
    expect(hubTier('harare')).toBe('sa');
  });
});
