import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, type Load, type LoadInput, type Quote, type Review, type User } from '../api';
import { onUnauthorized } from '../api/http';
import { IS_DEMO } from '../config';
import { toast } from '../components/Toast';
import { IconDash, IconPlus, IconQuote, IconStar, IconTruck, IconWeb } from '../components/Icons';
import { AdminCtx, type AdminState, type MessageRequest } from './AdminContext';
import { Dashboard } from './Dashboard';
import { Drawer } from './Drawer';
import { LoadDrawer } from './LoadDrawer';
import { LoadsView } from './LoadsView';
import { Login } from './Login';
import { MessageModal } from './MessageModal';
import { NewLoadDrawer } from './NewLoadDrawer';
import { QuoteDrawer } from './QuoteDrawer';
import { QuotesView } from './QuotesView';
import { ReviewsView } from './ReviewsView';

type View = 'dash' | 'quotes' | 'loads' | 'reviews';
type DrawerState = { kind: 'quote'; id: number } | { kind: 'load'; ref: string } | { kind: 'new'; prefill?: Partial<LoadInput> } | null;
const TITLES: Record<View, string> = { dash: 'Dashboard', quotes: 'Quotes', loads: 'Loads', reviews: 'Reviews' };
const POLL_MS = 30_000;

export function AdminApp({ view }: { view: View }) {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    api.me().then(setUser).catch(() => setUser(null)).finally(() => setChecking(false));
    return onUnauthorized(() => { setUser(null); toast('Your session ended. Please sign in again.'); });
  }, []);

  useEffect(() => { document.title = `${TITLES[view]} · Expeditors Operations`; window.scrollTo(0, 0); }, [view]);

  if (checking) return <div className="pt-login"><p className="muted">Loading…</p></div>;
  if (!user) return <Login onSignedIn={setUser} />;
  return <Portal user={user} view={view} onSignOut={() => { api.logout(); setUser(null); }} />;
}

function Portal({ user, view, onSignOut }: { user: User; view: View; onSignOut(): void }) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loads, setLoads] = useState<Load[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [msg, setMsg] = useState<MessageRequest | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [q, l, r] = await Promise.all([api.listQuotes(), api.listLoads(), api.listAllReviews()]);
      setQuotes(q); setLoads(l); setReviews(r);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not load data');
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, POLL_MS);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', onFocus); };
  }, [refresh]);

  const openQuote = useCallback((id: number) => setDrawer({ kind: 'quote', id }), []);
  const openLoad = useCallback((ref: string) => setDrawer({ kind: 'load', ref }), []);
  const openNewLoad = useCallback((prefill?: Partial<LoadInput>) => setDrawer({ kind: 'new', prefill }), []);
  const closeDrawer = useCallback(() => setDrawer(null), []);
  const closeMsg = useCallback(() => setMsg(null), []);

  const ctx: AdminState = useMemo(
    () => ({ user, quotes, loads, reviews, refresh, openQuote, openLoad, openNewLoad, closeDrawer, message: setMsg }),
    [user, quotes, loads, reviews, refresh, openQuote, openLoad, openNewLoad, closeDrawer]
  );

  const nNew = quotes.filter(q => q.status === 'new').length;
  const nActive = loads.filter(l => l.status !== 'Delivered').length;
  const nPending = reviews.filter(r => r.status === 'pending').length;
  const quote = drawer?.kind === 'quote' ? quotes.find(q => q.id === drawer.id) : undefined;
  const load = drawer?.kind === 'load' ? loads.find(l => l.ref === drawer.ref) : undefined;

  return (
    <AdminCtx.Provider value={ctx}>
      <div className="pt">
        <aside className="pt-side">
          <a className="pt-brand" href="#admin" aria-label="Portal home"><img src="assets/img/wordmark-white.png" alt="Expeditors" /><span>Operations</span></a>
          <nav className="pt-nav" aria-label="Portal">
            <a href="#admin" className={view === 'dash' ? 'on' : ''}><IconDash /><span>Dashboard</span></a>
            <a href="#admin-quotes" className={view === 'quotes' ? 'on' : ''}><IconQuote /><span>Quotes</span><b className="pt-count">{nNew || ''}</b></a>
            <a href="#admin-loads" className={view === 'loads' ? 'on' : ''}><IconTruck /><span>Loads</span><b className="pt-count">{nActive || ''}</b></a>
            <a href="#admin-reviews" className={view === 'reviews' ? 'on' : ''}><IconStar /><span>Reviews</span><b className="pt-count">{nPending || ''}</b></a>
            <a href="#top" className="pt-web"><IconWeb /><span>Website</span></a>
          </nav>
          <div className="pt-user">
            {IS_DEMO && (
              <>
                <span className="mode-pill">Demo mode</span>
                <p className="pt-demo-note">Sample data saved in this browser only.</p>
                <button className="pt-link" type="button" onClick={async () => { await api.resetDemo?.(); await refresh(); toast('Sample data reset'); }}>Reset sample data</button>
              </>
            )}
            <div className="pt-me">
              <span className="pt-avatar">{(user.name || user.email || '?').slice(0, 1).toUpperCase()}</span>
              <span className="pt-me-text"><b>{user.name}</b><small>{user.email}</small></span>
            </div>
            <button className="pt-link" type="button" onClick={onSignOut}>Sign out</button>
          </div>
        </aside>
        <main className="pt-main">
          <header className="pt-top">
            <h1>{TITLES[view]}</h1>
            <div className="pt-top-actions">
              <button className="btn btn-red btn-sm" type="button" onClick={() => openNewLoad()}><IconPlus />New load</button>
            </div>
          </header>
          <div className="pt-view">
            {view === 'dash' && <Dashboard />}
            {view === 'quotes' && <QuotesView />}
            {view === 'loads' && <LoadsView />}
            {view === 'reviews' && <ReviewsView />}
          </div>
        </main>
      </div>
      {drawer && (
        <Drawer onClose={closeDrawer} labelledBy="dr-title">
          {drawer.kind === 'quote' && quote && <QuoteDrawer key={quote.id + quote.updatedAt} quote={quote} />}
          {drawer.kind === 'load' && load && <LoadDrawer key={load.ref + load.updatedAt} load={load} />}
          {drawer.kind === 'new' && <NewLoadDrawer prefill={drawer.prefill} />}
          {((drawer.kind === 'quote' && !quote) || (drawer.kind === 'load' && !load)) && <div className="dr-body"><p className="muted">Loading…</p></div>}
        </Drawer>
      )}
      {msg && <MessageModal req={msg} onClose={closeMsg} />}
    </AdminCtx.Provider>
  );
}
