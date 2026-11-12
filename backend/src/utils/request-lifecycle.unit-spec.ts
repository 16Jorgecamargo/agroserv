import { AppException } from '../exceptions/app.exception.js';
import { REQUEST_STATUSES } from '../types/index.js';
import type { RequestStatus } from '../types/index.js';
import {
  allowedActions, applyTransition, LifecycleRequest, TransitionName, TRANSITIONS,
} from './request-lifecycle.js';

const TODAY = '2026-11-10';
const request = (status: RequestStatus, scheduledDate = TODAY, counterDate: string | null = null): LifecycleRequest => ({
  status, scheduledDate, counterDate,
});
const review = { reviewed: false, now: '2026-11-10T12:00:00.000Z' };

function failure(run: () => unknown): AppException {
  try {
    run();
  } catch (error) {
    return error as AppException;
  }
  throw new Error('expected an exception');
}

describe('request lifecycle', () => {
  const table: [TransitionName, RequestStatus, RequestStatus, string][] = [
    ['accept', 'pending', 'accepted', 'accepted'],
    ['reject', 'pending', 'rejected', 'rejected'],
    ['counter_offer', 'pending', 'counter_offer', 'counter_offer'],
    ['producer_cancel', 'pending', 'cancelled', 'cancelled'],
    ['accept_counter_offer', 'counter_offer', 'accepted', 'counter_offer_accepted'],
    ['decline_counter_offer', 'counter_offer', 'cancelled', 'counter_offer_declined'],
    ['producer_cancel', 'counter_offer', 'cancelled', 'cancelled'],
    ['start', 'accepted', 'in_progress', 'started'],
    ['producer_cancel', 'accepted', 'cancelled', 'cancelled'],
    ['provider_cancel', 'accepted', 'cancelled', 'cancelled'],
    ['complete', 'in_progress', 'completed', 'completed'],
    ['system_cancel', 'pending', 'cancelled', 'cancelled'],
    ['system_cancel', 'counter_offer', 'cancelled', 'cancelled'],
    ['system_cancel', 'accepted', 'cancelled', 'cancelled'],
    ['system_cancel', 'in_progress', 'cancelled', 'cancelled'],
  ];

  it.each(table)('%s moves %s to %s', (name, from, to, event) => {
    const rule = applyTransition(name, request(from), TODAY);
    expect(rule.to).toBe(to);
    expect(rule.event).toBe(event);
  });

  it('answers invalid_transition for every pair outside the table', () => {
    const names = Object.keys(TRANSITIONS) as TransitionName[];
    for (const status of REQUEST_STATUSES) {
      const invalid = names.filter((name) => !TRANSITIONS[name].from.includes(status));
      expect(invalid.length).toBeGreaterThan(0);
      for (const name of invalid) {
        const error = failure(() => applyTransition(name, request(status), TODAY));
        expect(error.getStatus()).toBe(409);
        expect(error.code).toBe('invalid_transition');
        expect(error.message).toBe('Esta ação não está mais disponível para esta solicitação.');
      }
    }
  });

  it('never lets users move in_progress to cancelled', () => {
    expect(() => applyTransition('producer_cancel', request('in_progress'), TODAY)).toThrow();
    expect(() => applyTransition('provider_cancel', request('in_progress'), TODAY)).toThrow();
  });

  it('blocks accepting a request whose date already passed', () => {
    const error = failure(() => applyTransition('accept', request('pending', '2026-11-09'), TODAY));
    expect(error.message).toBe('A data pedida já passou. Faça uma contraproposta com uma nova data.');
    expect(applyTransition('accept', request('pending', TODAY), TODAY).to).toBe('accepted');
  });

  it('uses the effective date when accepting a counter offer', () => {
    const past = failure(() => applyTransition('accept_counter_offer', request('counter_offer', '2026-11-09'), TODAY));
    expect(past.message).toBe('A data proposta já passou. Recuse a proposta ou cancele a solicitação.');
    const moved = applyTransition('accept_counter_offer', request('counter_offer', '2026-11-09', '2026-11-12'), TODAY);
    expect(moved.to).toBe('accepted');
  });

  it('only starts from the scheduled date on', () => {
    const early = failure(() => applyTransition('start', request('accepted', '2026-11-11'), TODAY));
    expect(early.message).toBe('O serviço só pode ser iniciado a partir da data agendada.');
    expect(applyTransition('start', request('accepted', '2026-11-09'), TODAY).to).toBe('in_progress');
  });

  it('computes allowed actions per role and status', () => {
    const actions = (role: 'producer' | 'provider', status: RequestStatus, date = TODAY) =>
      allowedActions(role, request(status, date), TODAY, review);
    expect(actions('producer', 'pending')).toEqual(['cancel', 'message', 'report']);
    expect(actions('provider', 'pending')).toEqual(['accept', 'reject', 'counter_offer', 'message', 'report']);
    expect(actions('provider', 'pending', '2026-11-01')).toEqual(['reject', 'counter_offer', 'message', 'report']);
    expect(actions('producer', 'counter_offer')).toEqual([
      'accept_counter_offer', 'decline_counter_offer', 'cancel', 'message', 'report',
    ]);
    expect(actions('producer', 'counter_offer', '2026-11-01')).toEqual(['decline_counter_offer', 'cancel', 'message', 'report']);
    expect(actions('provider', 'counter_offer')).toEqual(['message', 'report']);
    expect(actions('producer', 'accepted')).toEqual(['cancel', 'message', 'report']);
    expect(actions('provider', 'accepted')).toEqual(['start', 'cancel', 'message', 'report']);
    expect(actions('provider', 'accepted', '2026-11-20')).toEqual(['cancel', 'message', 'report']);
    expect(actions('producer', 'in_progress')).toEqual(['message', 'report']);
    expect(actions('provider', 'in_progress')).toEqual(['complete', 'message', 'report']);
    expect(actions('producer', 'completed')).toEqual(['review', 'report']);
    expect(actions('provider', 'completed')).toEqual(['report']);
    expect(actions('producer', 'rejected')).toEqual(['report']);
    expect(actions('provider', 'cancelled')).toEqual(['report']);
  });

  it('offers edit_review only inside the 7 day window', () => {
    const base = request('completed');
    const open = { reviewed: true, editableUntil: '2026-11-12T00:00:00.000Z', now: '2026-11-10T12:00:00.000Z' };
    expect(allowedActions('producer', base, TODAY, open)).toEqual(['edit_review', 'report']);
    expect(allowedActions('producer', base, TODAY, { ...open, now: '2026-11-13T00:00:00.000Z' })).toEqual(['report']);
    expect(allowedActions('admin', base, TODAY, open)).toEqual([]);
  });
});
