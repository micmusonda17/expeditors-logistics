/* Shared state for the public site: the planned route, what the map shows, and quote pre-filling. */
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { CORRIDORS, HUBS, isPublicHub } from '../lib/network';
import { navigate } from '../lib/router';

export interface Selection {
  kind: 'plan' | 'map' | 'corridor';
  from: string;
  to: string;
  corridorId?: string;
  nonce: number;
}

interface SiteState {
  plan: { from: string; to: string };
  setPlan(from: string, to: string): void;
  selection: Selection;
  selectCorridor(id: string): void;
  mapFrom: string;
  setMapFrom(k: string): void;
  pickTown(k: string): void;
  quotePrefill: { from: string; to: string; nonce: number } | null;
  requestQuote(from: string, to: string): void;
}

const Ctx = createContext<SiteState | null>(null);

export function SiteProvider({ children }: { children: ReactNode }) {
  const nonce = useRef(0);
  const next = () => ++nonce.current;
  const [plan, setPlanState] = useState({ from: 'lusaka', to: 'kitwe' });
  const [selection, setSelection] = useState<Selection>({ kind: 'plan', from: 'lusaka', to: 'kitwe', nonce: 0 });
  const [mapFrom, setMapFrom] = useState('lusaka');
  const [quotePrefill, setQuotePrefill] = useState<SiteState['quotePrefill']>(null);

  const setPlan = useCallback((from: string, to: string) => {
    setPlanState({ from, to });
    setMapFrom(from);
    setSelection({ kind: 'plan', from, to, nonce: next() });
  }, []);

  const selectCorridor = useCallback((id: string) => {
    const c = CORRIDORS.find(x => x.id === id);
    if (!c) return;
    setMapFrom(c.path[0]);
    setSelection({ kind: 'corridor', from: c.path[0], to: c.path[c.path.length - 1], corridorId: id, nonce: next() });
  }, []);

  const pickTown = useCallback((k: string) => {
    if (!HUBS[k] || k === mapFrom) return;
    setSelection({ kind: 'map', from: mapFrom, to: k, nonce: next() });
    const selectable = (x: string) => isPublicHub(x) && !HUBS[x].minor;
    if (selectable(mapFrom) && selectable(k)) setPlanState({ from: mapFrom, to: k });
  }, [mapFrom]);

  const requestQuote = useCallback((from: string, to: string) => {
    setQuotePrefill({ from, to, nonce: next() });
    navigate({ page: 'quote' });
  }, []);

  const value = useMemo(
    () => ({ plan, setPlan, selection, selectCorridor, mapFrom, setMapFrom, pickTown, quotePrefill, requestQuote }),
    [plan, setPlan, selection, selectCorridor, mapFrom, pickTown, quotePrefill, requestQuote]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSite() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSite must be used inside <SiteProvider>');
  return v;
}
