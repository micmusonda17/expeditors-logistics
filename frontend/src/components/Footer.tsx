import { COMPANY } from '../config';
import { Link, asset } from '../lib/router';

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <img className="word" src={asset('assets/img/wordmark-white.png')} alt="Expeditors" width={998} height={102} />
            <div className="tagline">LOGISTICS LIMITED</div>
            <p>Family-owned since {COMPANY.founded}, delivering all kinds of goods across Zambia in refrigerated and containerised trucks. South Africa coming soon.</p>
            <p className="addr">{COMPANY.location.replace(', Zambia', '')}<br />Zambia</p>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li><Link to={{ page: 'services' }}>Services</Link></li>
              <li><Link to={{ page: 'routes' }}>Routes</Link></li>
              <li><Link to={{ page: 'fleet' }}>Fleet</Link></li>
              <li><Link to={{ page: 'about' }}>About us</Link></li>
              <li><Link to={{ page: 'about', anchor: 'team' }}>Our team</Link></li>
              <li><Link to={{ page: 'faq' }}>FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4>Customers</h4>
            <ul>
              <li><Link to={{ page: 'quote' }}>Get a quote</Link></li>
              <li><Link to={{ page: 'track' }}>Track a load</Link></li>
              <li><Link to={{ page: 'reviews' }}>Reviews</Link></li>
              <li><Link to={{ page: 'contact' }}>Contact</Link></li>
              <li><Link to={{ page: 'admin', view: 'dash' }}>Staff portal</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-base">
          <span>© {new Date().getFullYear()} {COMPANY.name}. Registered in Zambia.</span>
          <span className="mono">Lusaka · Copperbelt · Southern · Eastern · Northern · Western</span>
        </div>
      </div>
    </footer>
  );
}
