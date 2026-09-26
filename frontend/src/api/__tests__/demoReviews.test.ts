import { describe, expect, it } from 'vitest';
import { demoApi } from '../demo';

const review = { name: 'Grace Phiri', company: 'Phiri General Dealers', town: 'Chipata', rating: 4, comment: 'On time and careful with the load.', contact: '', loadRef: '', website: '' };

describe('demo reviews', () => {
  it('starts with no reviews and only shows approved ones', async () => {
    await demoApi.resetDemo!();
    expect(await demoApi.getReviews()).toEqual({ average: null, count: 0, reviews: [] });

    await demoApi.submitReview(review);
    await demoApi.submitReview({ ...review, name: 'Joseph Banda', rating: 2 });
    expect((await demoApi.getReviews()).count).toBe(0);

    const all = await demoApi.listAllReviews();
    expect(all.map(r => r.status)).toEqual(['pending', 'pending']);
    for (const r of all) await demoApi.setReviewStatus(r.id, 'approved');

    const shown = await demoApi.getReviews();
    expect(shown.count).toBe(2);
    expect(shown.average).toBe(3);
    expect(shown.reviews[0]).not.toHaveProperty('contact');
  });

  it('ignores the honeypot', async () => {
    await demoApi.resetDemo!();
    await demoApi.submitReview({ ...review, website: 'http://spam' });
    expect(await demoApi.listAllReviews()).toEqual([]);
  });
});
