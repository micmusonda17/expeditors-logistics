import type { ReactNode } from 'react';
import { COMPANY, CONTACT_EMAILS } from '../config';
import { digits, waLink } from '../lib/format';
import { copyText } from '../lib/clipboard';
import { IconCopy, IconMail, IconPhone, IconPin, IconWhatsApp } from '../components/Icons';

function Card({ icon, label, values, small, children }: { icon: ReactNode; label: string; values: string[]; small?: boolean; children?: ReactNode }) {
  return (
    <div className="cmethod">
      <div className="ci">{icon}</div>
      <div className="k">{label}</div>
      {values.length ? values.map(v => <div className={'v' + (small ? ' sm' : '')} key={v}>{breakAt(v)}</div>) : <div className="v pending">Coming soon</div>}
      {children && <div className="row">{children}</div>}
    </div>
  );
}

// Let long email addresses wrap before the @ rather than mid-word.
const breakAt = (v: string) => {
  const i = v.indexOf('@');
  return i > 0 ? <>{v.slice(0, i)}<wbr />{v.slice(i)}</> : v;
};

const CopyBtn = ({ value }: { value: string }) => (
  <button type="button" className="linkbtn" onClick={() => copyText(value)}><IconCopy />Copy</button>
);

export function Contact() {
  const wa = digits(COMPANY.whatsapp);
  const mapsLink = COMPANY.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(COMPANY.location)}`;
  const waDisplay = wa ? '+' + wa.replace(/^(\d{3})(\d{2})(\d{3})(\d+)$/, '$1 $2 $3 $4') : '';
  return (
    <section className="section contact" id="contact" aria-labelledby="contact-title">
      <div className="wrap">
        <div className="section-head">
          <div>
            <p className="eyebrow">Contact</p>
            <h2 id="contact-title" className="display">Talk to us</h2>
          </div>
          <p className="lede">WhatsApp is the fastest way to reach us, from Zambia or anywhere on the road.</p>
        </div>
        <div className="contact-grid">
          <Card icon={<IconWhatsApp />} label="WhatsApp" values={waDisplay ? [waDisplay] : []}>
            {wa && <><a className="linkbtn" href={waLink('Hello Expeditors, I would like a quote.')} target="_blank" rel="noopener">Open chat</a><CopyBtn value={waDisplay} /></>}
          </Card>
          <Card icon={<IconPhone />} label="Phone" values={COMPANY.phones.map(p => p.display)}>
            {COMPANY.phones.map(p => <a key={p.dial} className="linkbtn" href={`tel:${p.dial}`}>Call {p.display.slice(-4)}</a>)}
          </Card>
          <Card icon={<IconMail />} label="Email" values={CONTACT_EMAILS} small>
            {CONTACT_EMAILS.length > 0 && <a className="linkbtn" href={`mailto:${CONTACT_EMAILS.join(',')}`}>Email us</a>}
          </Card>
          <Card icon={<IconPin />} label="Location" values={[COMPANY.location]} small>
            <a className="linkbtn" href={mapsLink} target="_blank" rel="noopener">Open in Maps</a>
          </Card>
        </div>
        <p className="director-line">
          {COMPANY.director && <>Founder and Managing Director: <b>{COMPANY.director}</b> · </>}Family-owned and on the road since <b>{COMPANY.founded}</b>
        </p>
      </div>
    </section>
  );
}
