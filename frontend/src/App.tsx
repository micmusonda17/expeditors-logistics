import { useEffect, useRef } from 'react';
import { IS_DEMO } from './config';
import { useRoute, type PageKey, type Route } from './lib/router';
import { SiteProvider } from './site/SiteContext';
import { AdminApp } from './admin/AdminApp';
import { DemoBar } from './components/DemoBar';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { Toaster } from './components/Toast';
import { WhatsAppFab } from './components/WhatsAppFab';
import { HomePage } from './pages/HomePage';
import { AboutPage, ContactPage, FaqPage, FleetPage, QuotePage, ReviewsPage, RoutesPage, ServicesPage, TrackPage } from './pages/InnerPages';
import { PAGE_META } from './pages/meta';

type SiteRoute = Exclude<Route, { page: 'admin' }>;

function Page({ route }: { route: SiteRoute }) {
  switch (route.page) {
    case 'services': return <ServicesPage />;
    case 'routes': return <RoutesPage />;
    case 'fleet': return <FleetPage />;
    case 'about': return <AboutPage />;
    case 'reviews': return <ReviewsPage />;
    case 'faq': return <FaqPage />;
    case 'quote': return <QuotePage />;
    case 'track': return <TrackPage track={route.track} />;
    case 'contact': return <ContactPage />;
    default: return <HomePage />;
  }
}

function setMeta(page: PageKey) {
  const m = PAGE_META[page];
  document.title = m.title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', m.description);
}

/** Page changes start at the top; links to a part of a page (e.g. Services > Refrigerated) scroll to it. */
function useScrollOnRoute(route: SiteRoute) {
  const prev = useRef<PageKey | null>(null);
  useEffect(() => {
    const samePage = prev.current === route.page;
    const first = prev.current === null;
    prev.current = route.page;
    const frame = requestAnimationFrame(() => {
      const el = route.anchor ? document.getElementById(route.anchor) : null;
      if (el) el.scrollIntoView({ behavior: samePage ? 'smooth' : 'instant', block: 'start' });
      else if (!samePage) window.scrollTo({ top: 0, behavior: 'instant' });
      // Screen readers announce the new page.
      if (!first && !samePage) document.getElementById('main')?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [route]);
}

function Site({ route }: { route: SiteRoute }) {
  useEffect(() => setMeta(route.page), [route.page]);
  useScrollOnRoute(route);
  return (
    <SiteProvider>
      {IS_DEMO && <DemoBar />}
      <Header current={route} />
      <main id="main" tabIndex={-1} className={'page page-' + route.page}>
        <Page route={route} />
      </main>
      <Footer />
      <WhatsAppFab />
    </SiteProvider>
  );
}

export function App() {
  const route = useRoute();
  return (
    <>
      {route.page === 'admin' ? <AdminApp view={route.view} /> : <Site route={route} />}
      <Toaster />
    </>
  );
}
