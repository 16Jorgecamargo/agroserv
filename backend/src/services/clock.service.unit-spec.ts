import { addDays, ClockService, isValidDay } from './clock.service.js';

describe('ClockService', () => {
  it('uses the Brasilia day late at night', () => {
    const clock = new ClockService();
    vi.spyOn(clock, 'now').mockReturnValue(new Date('2026-11-11T01:30:00Z'));
    expect(clock.today()).toBe('2026-11-10');
  });

  it('validates and adds days', () => {
    expect(isValidDay('2026-02-30')).toBe(false);
    expect(isValidDay('2026-02-28')).toBe(true);
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});
