import { COMPANY } from '../config';

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <img className="word" src="assets/img/wordmark-white.png" alt="Expeditors" width={998} height={102} />
            <div className="tagline">LOGISTICS LIMITED</div>
            <p>Family-owned since {COMPANY.founded}, delivering all kinds of goods across Zambia in refrigerated and containerised trucks. South Africa coming soon.</p>
            <p className="addr">{COMPANY.location.replace(', Zambia', '')}<br />Zambia</p>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li><a href="#services">Services</a></li>
              <li><a href="#routes">Routes</a></li>
              <li><a href="#fleet">Fleet</a></li>
              <li><a href="#about">About us</a></li>
              <li><a href="#team">Our team</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4>Customers</h4>
            <ul>
              <li><a href="#quote">Get a quote</a></li>
              <li><a href="#track">Track a load</a></li>
              <li><a href="#reviews">Reviews</a></li>
              <li><a href="#contact">Contact</a></li>
              <li><a href="#admin">Staff portal</a></li>
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
