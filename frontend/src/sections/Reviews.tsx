import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError, type ReviewInput, type ReviewSummary } from '../api';
import { IS_DEMO } from '../config';
import { fmtDay } from '../lib/format';
import { Link } from '../lib/router';
import { IconArrow, IconCheck, IconStar } from '../components/Icons';
import { toast } from '../components/Toast';

export function Stars({ value, size = 18, label }: { value: number; size?: number; label?: string }) {
  return (
    <span className="stars" role="img" aria-label={label ?? `${value} out of 5 stars`} style={{ ['--s' as string]: `${size}px` }}>
      {[1, 2, 3, 4, 5].map(i => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <span key={i} className="star">
            <IconStar className="star-bg" />
            {fill > 0 && <span className="star-fill" style={{ width: `${fill * 100}%` }}><IconStar /></span>}
          </span>
        );
      })}
    </span>
  );
}

const EMPTY: ReviewInput = { name: '', company: '', town: '', rating: 0, comment: '', contact: '', loadRef: '', website: '' };
const WORDS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

function ReviewForm({ onDone }: { onDone(): void }) {
  const [f, setF] = useState(EMPTY);
  const [bad, setBad] = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState(false);
  const set = (k: keyof ReviewInput) => (e: { target: { value: string } }) => setF(x => ({ ...x, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    const errs = { name: f.name.trim().length < 2, rating: f.rating < 1, comment: f.comment.trim().length < 10 };
    setBad(errs);
    const first = Object.entries(errs).find(([, v]) => v)?.[0];
    if (first) { document.getElementById(first === 'rating' ? 'rv-rating-1' : 'rv-' + first)?.focus(); toast('Check the highlighted fields'); return; }
    setSending(true);
    try {
      await api.submitReview({ ...f, loadRef: f.loadRef.trim().toUpperCase() });
      onDone();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Could not send your review. Please try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="review-form" noValidate onSubmit={submit}>
      <fieldset className={'rating-field' + (bad.rating ? ' invalid' : '')}>
        <legend>Your rating <span className="req">*</span></legend>
        <div className="rating-pick">
          {[5, 4, 3, 2, 1].map(n => (
            <span key={n}>
              <input type="radio" id={`rv-rating-${n}`} name="rating" value={n} checked={f.rating === n} onChange={() => { setF(x => ({ ...x, rating: n })); setBad(b => ({ ...b, rating: false })); }} />
              <label htmlFor={`rv-rating-${n}`} title={WORDS[n]}><IconStar /><span className="sr-only">{n} {n === 1 ? 'star' : 'stars'}, {WORDS[n]}</span></label>
            </span>
          ))}
        </div>
        <span className="rating-word">{f.rating ? WORDS[f.rating] : 'Tap a star'}</span>
        <span className="err">Choose a rating.</span>
      </fieldset>
      <div className="form-grid">
        <div className={'field' + (bad.name ? ' invalid' : '')}><label htmlFor="rv-name">Your name <span className="req">*</span></label><input id="rv-name" autoComplete="name" value={f.name} onChange={set('name')} /><span className="err">Enter your name.</span></div>
        <div className="field"><label htmlFor="rv-company">Company</label><input id="rv-company" autoComplete="organization" value={f.company} onChange={set('company')} /></div>
        <div className={'field full' + (bad.comment ? ' invalid' : '')}>
          <label htmlFor="rv-comment">Your review <span className="req">*</span></label>
          <textarea id="rv-comment" maxLength={1500} placeholder="What did we move for you, and how did it go?" value={f.comment} onChange={set('comment')} />
          <span className="err">Write at least a sentence.</span>
        </div>
        <div className="field"><label htmlFor="rv-town">Town</label><input id="rv-town" placeholder="e.g. Kitwe" value={f.town} onChange={set('town')} /></div>
        <div className="field"><label htmlFor="rv-loadRef">Load reference</label><input id="rv-loadRef" placeholder="e.g. ELL-7K3Q9" value={f.loadRef} onChange={set('loadRef')} /></div>
        <div className="field full"><label htmlFor="rv-contact">Phone or email <span className="opt">(private)</span></label><input id="rv-contact" placeholder="Never shown on the website" value={f.contact} onChange={set('contact')} /></div>
        <div className="hp" aria-hidden><label htmlFor="rv-website">Leave empty</label><input id="rv-website" tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} /></div>
      </div>
      <div className="form-actions">
        <button className="btn btn-red" type="submit" disabled={sending}>{sending ? 'Sending...' : 'Post my review'} <IconArrow /></button>
        <span className="small">Your name, company and town are shown with your review. Phone or email is never shown.</span>
      </div>
    </form>
  );
}

export function Reviews({ head = true }: { head?: boolean } = {}) {
  const [data, setData] = useState<ReviewSummary | null>(null);
  const [failed, setFailed] = useState(false);
  const [sent, setSent] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => { api.getReviews().then(setData).catch(() => setFailed(true)); }, []);

  const count = data?.count ?? 0;
  return (
    <section className="section reviews" id="reviews" aria-labelledby={head ? 'reviews-title' : undefined}>
      <div className="wrap">
        {head && (
          <div className="section-head">
            <div>
              <p className="eyebrow">Reviews</p>
              <h2 id="reviews-title" className="display">What customers say</h2>
            </div>
            <p className="lede">Reviews from customers we have delivered for. Our team checks each one before it appears, so what you read here is real.</p>
          </div>
        )}
        <div className="reviews-grid">
          <div className="reviews-list">
            <div className="rv-summary">
              {count > 0 && data?.average != null ? (
                <>
                  <div className="rv-avg num">{data.average.toFixed(1)}</div>
                  <div><Stars value={data.average} size={22} /><p>{count} {count === 1 ? 'review' : 'reviews'}</p></div>
                </>
              ) : (
                <div className="rv-none">
                  <Stars value={0} size={22} label="No ratings yet" />
                  <p>{failed ? 'Reviews could not be loaded right now.' : data ? 'No reviews yet. Moved goods with us? Be the first to share how it went.' : 'Loading reviews...'}</p>
                </div>
              )}
            </div>
            {data?.reviews.map(r => (
              <article className="rv-card" key={r.id}>
                <div className="rv-top"><Stars value={r.rating} /><time dateTime={r.createdAt}>{fmtDay(r.createdAt, true)}</time></div>
                <p className="rv-text">{r.comment}</p>
                <p className="rv-who"><b>{r.name}</b>{[r.company, r.town].filter(Boolean).length > 0 && <span>{[r.company, r.town].filter(Boolean).join(', ')}</span>}</p>
              </article>
            ))}
          </div>
          <div className="panel rv-panel">
            {sent ? (
              <div className="done">
                <div className="done-head">
                  <div className="tick"><IconCheck /></div>
                  <div><h3>Thank you for your review</h3><p>It will appear here once our team has checked it.</p></div>
                </div>
                {IS_DEMO && <p className="notice">Preview: open the portal, approve the review under Reviews, then come back here to see it. <Link to={{ page: 'admin', view: 'reviews' }}>Open the portal</Link></p>}
                <div className="done-actions"><button className="btn btn-ghost" type="button" onClick={() => { setSent(false); setFormOpen(true); }}>Write another</button></div>
              </div>
            ) : formOpen ? (
              <>
                <h3>Leave a review</h3>
                <ReviewForm onDone={() => { setSent(true); setFormOpen(false); }} />
              </>
            ) : (
              <div className="rv-cta">
                <h3>Worked with us?</h3>
                <p>Tell other businesses how your delivery went. It takes a minute, and it helps a family business grow.</p>
                <button className="btn btn-red" type="button" onClick={() => setFormOpen(true)}>Leave a review <IconArrow /></button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
