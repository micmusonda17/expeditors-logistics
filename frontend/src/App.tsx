import { useEffect } from 'react';
import { IS_DEMO } from './config';
import { useHashRoute } from './lib/useHashRoute';
import { SiteProvider } from './site/SiteContext';
import { AdminApp } from './admin/AdminApp';
import { DemoBar } from './components/DemoBar';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { Toaster } from './components/Toast';
import { WhatsAppFab } from './components/WhatsAppFab';
import { Contact } from './sections/Contact';
import { Faq } from './sections/Faq';
import { Fleet } from './sections/Fleet';
import { Hero } from './sections/Hero';
import { Process } from './sections/Process';
import { QuoteSection } from './sections/QuoteSection';
import { RoutesSection } from './sections/RoutesSection';
import { Services } from './sections/Services';
import { About } from './sections/About';
import { Reviews } from './sections/Reviews';
import { TrackSection } from './sections/TrackSection';

function Site({ track, section }: { track?: string; section?: string }) {
  useEffect(() => { document.title = 'Expeditors Logistics'; }, []);
  useEffect(() => {
    if (section) document.getElementById(section)?.scrollIntoView();
  }, [section]);
  return (
    <SiteProvider>
      {IS_DEMO && <DemoBar />}
      <Header />
      <main id="top">
        <Hero />
        <Services />
        <RoutesSection />
        <Fleet />
        <About />
        <Process />
        <QuoteSection />
        <TrackSection deepLink={track} />
        <Reviews />
        <Faq />
        <Contact />
      </main>
      <Footer />
      <WhatsAppFab />
    </SiteProvider>
  );
}

export function App() {
  const route = useHashRoute();
  return (
    <>
      {route.page === 'admin' ? <AdminApp view={route.view} /> : <Site track={route.track} section={route.section} />}
      <Toaster />
    </>
  );
}
