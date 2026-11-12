import { addRating, changeRating, removeRating, roundRating } from './ratings.js';

describe('rating averages', () => {
  it('adds a rating with the contract formula', () => {
    const totals = addRating({ rating: 4.8, reviewCount: 58 }, 1);
    expect(totals.reviewCount).toBe(59);
    expect(totals.rating).toBeCloseTo((4.8 * 58 + 1) / 59, 10);
    expect(addRating({ rating: 0, reviewCount: 0 }, 4)).toEqual({ rating: 4, reviewCount: 1 });
  });

  it('adjusts the average when a rating changes', () => {
    const totals = changeRating({ rating: 4, reviewCount: 4 }, 2, 4);
    expect(totals).toEqual({ rating: 4.5, reviewCount: 4 });
  });

  it('removes a hidden rating and falls back to zero', () => {
    const totals = removeRating({ rating: 4, reviewCount: 2 }, 3);
    expect(totals).toEqual({ rating: 5, reviewCount: 1 });
    expect(removeRating({ rating: 5, reviewCount: 1 }, 5)).toEqual({ rating: 0, reviewCount: 0 });
  });

  it('rounds averages to two decimals', () => {
    expect(roundRating(4.735593)).toBe(4.74);
  });
});
