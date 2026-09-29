import { useEffect, useState } from 'react';
import { api, type ReviewSummary } from '../api';
import { COMPANY, TEAM } from '../config';
import { fmtDay } from '../lib/format';
import { Link, asset } from '../lib/router';
import { CtaBand } from '../components/CtaBand';
import { IconArrow } from '../components/Icons';
import { Hero } from '../sections/Hero';
import { Highlights } from '../sections/Highlights';
import { Process } from '../sections/Process';
import { Stars } from '../sections/Reviews';
import { Services } from '../sections/Services';

/** Short family story with a link to the full About page. */
function AboutTeaser() {
  const founder = TEAM.find(m => m.founder);
  const faces = TEAM.filter(m => m.photo);
  return (
    <section className="section about-teaser" aria-labelledby="at-title">
      <div className="wrap at-grid">
        <div>
          <p className="eyebrow">About us</p>
          <h2 id="at-title" className="display">A family you can rely on</h2>
          <p className="lede">
            Expeditors Logistics began as {founder?.name ?? COMPANY.director}&rsquo;s idea. He realised businesses deserved a
            transporter they could truly rely on, run by a family that treats you like family. Since {COMPANY.founded},
            that is exactly what we have been.
          </p>
          <div className="at-actions">
            <Link className="btn btn-ghost" to={{ page: 'about', anchor: 'story' }}>Read our story <IconArrow /></Link>
            <Link className="btn btn-ghost" to={{ page: 'about', anchor: 'team' }}>Meet the team <IconArrow /></Link>
          </div>
        </div>
        <ul className="at-faces" aria-label="Our team">
          {faces.map(m => (
            <li key={m.name}>
              <img src={asset(m.photo!)} alt="" loading="lazy" width={640} height={704} />
              <b>{m.name}</b>
              <span>{m.role}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Latest reviews. Hidden until there is at least one approved review. */
function ReviewsTeaser() {
  const [data, setData] = useState<ReviewSummary | null>(null);
  useEffect(() => { api.getReviews().then(setData).catch(() => {}); }, []);
  if (!data || data.count === 0 || data.average == null) return null;
  return (
    <section className="section reviews-teaser" aria-labelledby="rt-title">
      <div className="wrap">
        <div className="section-head">
          <div>
            <p className="eyebrow">Reviews</p>
            <h2 id="rt-title" className="display">What customers say</h2>
          </div>
          <div className="rt-score">
            <span className="rv-avg num">{data.average.toFixed(1)}</span>
            <span><Stars value={data.average} size={20} /><br />{data.count} {data.count === 1 ? 'review' : 'reviews'}</span>
          </div>
        </div>
        <div className="rt-grid">
          {data.reviews.slice(0, 3).map(r => (
            <article className="rv-card" key={r.id}>
              <div className="rv-top"><Stars value={r.rating} /><time dateTime={r.createdAt}>{fmtDay(r.createdAt, true)}</time></div>
              <p className="rv-text">{r.comment}</p>
              <p className="rv-who"><b>{r.name}</b>{[r.company, r.town].filter(Boolean).length > 0 && <span>{[r.company, r.town].filter(Boolean).join(', ')}</span>}</p>
            </article>
          ))}
        </div>
        <p className="rt-more"><Link className="more-link" to={{ page: 'reviews' }}>Read all reviews <IconArrow /></Link></p>
      </div>
    </section>
  );
}

export function HomePage() {
  return (
    <>
      <Hero />
      <Highlights />
      <Services />
      <AboutTeaser />
      <Process />
      <ReviewsTeaser />
      <CtaBand />
    </>
  );
}
