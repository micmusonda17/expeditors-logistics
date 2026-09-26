import { useEffect, useState } from 'react';
import { IconMenu } from './Icons';

const LINKS = [['services', 'Services'], ['routes', 'Routes'], ['fleet', 'Fleet'], ['about', 'About'], ['reviews', 'Reviews'], ['track', 'Track'], ['faq', 'FAQ'], ['contact', 'Contact']] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); }),
      { rootMargin: '-45% 0px -50% 0px' }
    );
    LINKS.forEach(([id]) => { const s = document.getElementById(id); if (s) io.observe(s); });
    return () => io.disconnect();
  }, []);

  const close = () => setOpen(false);
  return (
    <header className={'site-header' + (open ? ' open' : '')}>
      <div className="wrap">
        <a className="brand" href="#top" aria-label="Expeditors Logistics Limited, home">
          <img className="word" src="assets/img/wordmark.png" alt="Expeditors" width={998} height={102} />
          <img className="tag" src="assets/img/tagline.png" alt="Logistics Limited" width={762} height={50} />
        </a>
        <button className="menu-btn" aria-expanded={open} aria-controls="nav" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(o => !o)}>
          <IconMenu />
        </button>
        <nav className="nav" id="nav" aria-label="Main">
          {LINKS.map(([id, label]) => (
            <a key={id} href={`#${id}`} className={active === id ? 'active' : ''} onClick={close}>{label}</a>
          ))}
          <a className="btn btn-red" href="#quote" onClick={close}>Get a quote</a>
        </nav>
        <a className="btn btn-red btn-sm header-cta" href="#quote">Get a quote</a>
      </div>
    </header>
  );
}
