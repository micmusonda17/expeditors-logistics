import { COMPANY, TEAM, type TeamMember } from '../config';
import { digits, firstName } from '../lib/format';
import { asset } from '../lib/router';
import { IconMail, IconPhone, IconWhatsApp } from '../components/Icons';

const initials = (name: string) => {
  const parts = name.replace(/\b(Sr|Jr)\.?$/i, '').trim().split(/\s+/);
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
};

function Portrait({ m }: { m: TeamMember }) {
  return (
    <div className={'team-pic' + (m.photo ? '' : ' mono')}>
      {m.photo ? <img src={asset(m.photo)} alt={`Portrait of ${m.name}`} loading="lazy" /> : <span className="team-initials" aria-hidden>{initials(m.name)}</span>}
      {m.founder && <b className="team-badge">Founder<span> · {COMPANY.founded}</span></b>}
    </div>
  );
}

function Member({ m }: { m: TeamMember }) {
  const tel = digits(m.phone);
  const wa = m.whatsapp && tel ? `https://wa.me/${tel}?text=${encodeURIComponent(`Hello ${firstName(m.name)}, I found you on the ${COMPANY.shortName} website.`)}` : '';
  const hasLinks = m.email || tel;
  return (
    <article className={'member' + (m.founder ? ' founder' : '')}>
      <Portrait m={m} />
      <div className="member-body">
        <h3>{m.name}</h3>
        <p className="member-role">{m.role}{m.alsoRole && <span>{m.alsoRole}</span>}</p>
        <p className="member-bio">{m.bio}</p>
        {m.phone && <p className="member-phone">{m.phone}</p>}
        {hasLinks && (
          <div className="member-links">
            {wa && <a className="wa" href={wa} target="_blank" rel="noopener" aria-label={`WhatsApp ${m.name}`}><IconWhatsApp /><span>WhatsApp</span></a>}
            {tel && <a href={`tel:+${tel}`} aria-label={`Call ${m.name} on ${m.phone}`}><IconPhone /><span>Call</span></a>}
            {m.email && <a href={`mailto:${m.email}`} title={m.email} aria-label={`Email ${m.name}`}><IconMail /><span>Email</span></a>}
          </div>
        )}
      </div>
    </article>
  );
}

export function TeamGrid() {
  return (
    <div className="team-grid">
      {TEAM.map(m => <Member key={m.name} m={m} />)}
    </div>
  );
}
