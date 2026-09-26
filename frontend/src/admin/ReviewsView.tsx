import { useState } from 'react';
import { api, type Review, type ReviewStatus } from '../api';
import { ago } from '../lib/format';
import { toast } from '../components/Toast';
import { Stars } from '../sections/Reviews';
import { statusClass, useAdmin } from './AdminContext';

const STATUS: [ReviewStatus, string][] = [['pending', 'Waiting'], ['approved', 'On website'], ['hidden', 'Hidden']];

function ReviewItem({ r }: { r: Review }) {
  const { refresh } = useAdmin();
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const act = async (fn: () => Promise<unknown>, done: string) => {
    setBusy(true);
    try { await fn(); await refresh(); toast(done); }
    catch (e) { toast(e instanceof Error ? e.message : 'Something went wrong'); }
    finally { setBusy(false); }
  };
  return (
    <article className="card rv-item">
      <div className="rv-item-top">
        <Stars value={r.rating} />
        <span className={'pill ' + statusClass(r.status)}>{STATUS.find(s => s[0] === r.status)?.[1]}</span>
        <small className="muted">{ago(r.createdAt)}</small>
      </div>
      <p className="rv-item-text">{r.comment}</p>
      <p className="rv-item-who"><b>{r.name}</b>{[r.company, r.town].filter(Boolean).join(', ') && <> · {[r.company, r.town].filter(Boolean).join(', ')}</>}</p>
      {(r.contact || r.loadRef) && (
        <p className="rv-item-private">
          <span className="muted">Private:</span> {r.contact || 'no contact given'}{r.loadRef && <> · load <span className="mono">{r.loadRef}</span></>}
        </p>
      )}
      <div className="rv-item-actions">
        {r.status !== 'approved' && <button className="btn btn-sm btn-red" type="button" disabled={busy} onClick={() => act(() => api.setReviewStatus(r.id, 'approved'), 'Review is now on the website')}>Approve</button>}
        {r.status !== 'hidden' && <button className="btn btn-sm btn-ghost" type="button" disabled={busy} onClick={() => act(() => api.setReviewStatus(r.id, 'hidden'), 'Review hidden')}>{r.status === 'approved' ? 'Take down' : 'Hide'}</button>}
        {confirmDelete
          ? <button className="btn btn-sm btn-ghost danger" type="button" disabled={busy} onClick={() => act(() => api.deleteReview(r.id), 'Review deleted')}>Confirm delete</button>
          : <button className="pt-link" type="button" onClick={() => setConfirmDelete(true)}>Delete</button>}
      </div>
    </article>
  );
}

export function ReviewsView() {
  const { reviews } = useAdmin();
  const [filter, setFilter] = useState<ReviewStatus | 'all'>('pending');
  const list = reviews.filter(r => filter === 'all' || r.status === filter);
  const tabs: [ReviewStatus | 'all', string, number][] = [...STATUS.map(([k, n]) => [k, n, reviews.filter(r => r.status === k).length] as [ReviewStatus, string, number]), ['all', 'All', reviews.length]];
  return (
    <>
      <div className="toolbar">
        <div className="tabs" role="tablist">
          {tabs.map(([k, n, c]) => <button key={k} type="button" role="tab" aria-selected={filter === k} onClick={() => setFilter(k)}>{n}<b>{c}</b></button>)}
        </div>
        <p className="muted small rv-help">New reviews wait here until you approve them. Check the private contact or load reference to confirm they are real customers.</p>
      </div>
      {list.length ? (
        <div className="rv-items">{list.map(r => <ReviewItem key={r.id} r={r} />)}</div>
      ) : (
        <div className="card empty-state">
          <h3>{reviews.length ? 'Nothing here' : 'No reviews yet'}</h3>
          <p>{reviews.length ? 'Try another tab.' : 'Reviews left on the website land here for you to approve. Send happy customers the link to the Reviews section.'}</p>
        </div>
      )}
    </>
  );
}
