import type { ReactNode } from 'react';
import { Link, asset, type Route } from '../lib/router';

export interface Crumb { label: string; to?: Route }

/** Banner at the top of every inner page: breadcrumb, page title and a short intro. */
export function PageHeader({ eyebrow, title, lede, crumbs, children }: { eyebrow?: string; title: ReactNode; lede?: ReactNode; crumbs: Crumb[]; children?: ReactNode }) {
  return (
    <header className="page-head">
      <img className="page-head-art" src={asset('assets/img/emblem.png')} alt="" aria-hidden width={918} height={320} />
      <div className="wrap">
        <nav className="crumbs" aria-label="Breadcrumb">
          <ol>
            <li><Link to={{ page: 'home' }}>Home</Link></li>
            {crumbs.map((c, i) => (
              <li key={c.label} aria-current={i === crumbs.length - 1 ? 'page' : undefined}>
                {c.to && i < crumbs.length - 1 ? <Link to={c.to}>{c.label}</Link> : <span>{c.label}</span>}
              </li>
            ))}
          </ol>
        </nav>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="display">{title}</h1>
        {lede && <p className="lede">{lede}</p>}
        {children && <div className="page-head-actions">{children}</div>}
      </div>
    </header>
  );
}
