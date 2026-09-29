import { COMPANY } from '../config';
import { waLink } from '../lib/format';
import { Link } from '../lib/router';
import { IconArrow, IconWhatsApp } from './Icons';

/** Closing call to action at the bottom of most pages. */
export function CtaBand({ title = 'Ready to move a load?', text = 'Tell us what is moving, from where to where, and when. We reply with a rate and the truck that fits.' }: { title?: string; text?: string }) {
  return (
    <section className="cta-band" aria-label="Get a quote">
      <div className="wrap">
        <div className="cta-card">
          <div>
            <h2 className="display">{title}</h2>
            <p>{text}</p>
          </div>
          <div className="cta-actions">
            <Link className="btn btn-red" to={{ page: 'quote' }}>Get a quote <IconArrow /></Link>
            {COMPANY.whatsapp && (
              <a className="btn btn-wa" href={waLink('Hello Expeditors, I would like a quote.')} target="_blank" rel="noopener"><IconWhatsApp />WhatsApp us</a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
