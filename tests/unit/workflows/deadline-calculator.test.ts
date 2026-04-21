import { describe, it, expect } from 'vitest';
import {
  addBusinessDays,
  calculateDeadline,
  TEXAS_DEADLINE_RULES,
  type DeadlineRule,
} from '../../../packages/workflows/src/deadline-calculator';

// Helper to get a rule by id
function getRule(id: string): DeadlineRule {
  const rule = TEXAS_DEADLINE_RULES.find((r) => r.id === id);
  if (!rule) throw new Error(`Rule ${id} not found`);
  return rule;
}

// Helper to format date as YYYY-MM-DD for readable assertions
function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

describe('deadline-calculator', () => {
  // -------------------------------------------------------------------------
  // addBusinessDays
  // -------------------------------------------------------------------------

  describe('addBusinessDays', () => {
    it('adding 0 business days returns the same date', () => {
      const date = new Date('2026-04-20'); // Monday
      const result = addBusinessDays(date, 0);
      expect(fmt(result)).toBe('2026-04-20');
    });

    it('adding 1 business day from Friday lands on Monday', () => {
      const friday = new Date('2026-04-24'); // Friday
      const result = addBusinessDays(friday, 1);
      expect(fmt(result)).toBe('2026-04-27'); // Monday
    });

    it('adding 5 business days from Monday lands on next Monday', () => {
      const monday = new Date('2026-04-20'); // Monday
      const result = addBusinessDays(monday, 5);
      expect(fmt(result)).toBe('2026-04-27'); // next Monday
    });

    it('adding 5 business days from Wednesday skips the weekend', () => {
      const wednesday = new Date('2026-04-22'); // Wednesday
      const result = addBusinessDays(wednesday, 5);
      // Thu(1), Fri(2), skip Sat/Sun, Mon(3), Tue(4), Wed(5) = Apr 29
      expect(fmt(result)).toBe('2026-04-29');
    });

    it('adding 10 business days spans 2 weeks', () => {
      const monday = new Date('2026-04-20'); // Monday
      const result = addBusinessDays(monday, 10);
      expect(fmt(result)).toBe('2026-05-04'); // Monday 2 weeks later
    });

    it('adding 20 business days from a Monday spans 4 weeks', () => {
      const monday = new Date('2026-01-05'); // Monday Jan 5
      const result = addBusinessDays(monday, 20);
      expect(fmt(result)).toBe('2026-02-02'); // Monday 4 weeks later
    });

    it('does not mutate the input date', () => {
      const original = new Date('2026-04-20');
      const originalTime = original.getTime();
      addBusinessDays(original, 5);
      expect(original.getTime()).toBe(originalTime);
    });
  });

  // -------------------------------------------------------------------------
  // calculateDeadline -- Divorce 60-day waiting period
  // -------------------------------------------------------------------------

  describe('Texas divorce 60-day waiting period', () => {
    const rule = getRule('tx-divorce-60-day-wait');

    it('adds 60 calendar days from petition filing date', () => {
      const filed = new Date('2026-01-15');
      const deadline = calculateDeadline(filed, rule);
      expect(fmt(deadline)).toBe('2026-03-16');
    });

    it('crosses month boundary correctly', () => {
      const filed = new Date('2026-03-01');
      const deadline = calculateDeadline(filed, rule);
      expect(fmt(deadline)).toBe('2026-04-30');
    });

    it('rule is configured as CALENDAR type', () => {
      expect(rule.calendarOrBusiness).toBe('CALENDAR');
      expect(rule.daysFromTrigger).toBe(60);
    });
  });

  // -------------------------------------------------------------------------
  // calculateDeadline -- Answer deadline (20 days + next Monday)
  // -------------------------------------------------------------------------

  describe('Texas answer deadline (20 days + next Monday)', () => {
    const rule = getRule('tx-answer-deadline');

    it('20 calendar days from service + next Monday when landing on Wednesday', () => {
      // Service on 2026-01-05 (Monday). +20 days = 2026-01-25 (Sunday).
      // Next Monday after Sunday = 2026-01-26.
      const served = new Date('2026-01-05');
      const deadline = calculateDeadline(served, rule);
      expect(fmt(deadline)).toBe('2026-01-26'); // Monday
      expect(deadline.getDay()).toBe(1); // Monday
    });

    it('if +20 days lands on Monday, returns that Monday', () => {
      // Service on 2026-04-06 (Monday). +20 = 2026-04-26 (Sunday).
      // Next Monday = 2026-04-27.
      const served = new Date('2026-04-06');
      const deadline = calculateDeadline(served, rule);
      expect(deadline.getDay()).toBe(1); // Monday
    });

    it('result is always a Monday', () => {
      // Try several dates
      const dates = [
        new Date('2026-02-01'),
        new Date('2026-03-15'),
        new Date('2026-06-10'),
        new Date('2026-09-22'),
      ];
      for (const d of dates) {
        const deadline = calculateDeadline(d, rule);
        expect(deadline.getDay()).toBe(1); // Monday = day 1
      }
    });

    it('rule trigger is SERVICE_COMPLETED', () => {
      expect(rule.triggerEvent).toBe('SERVICE_COMPLETED');
    });
  });

  // -------------------------------------------------------------------------
  // calculateDeadline -- Discovery response (30 calendar days)
  // -------------------------------------------------------------------------

  describe('Texas discovery response deadline (30 calendar days)', () => {
    const rule = getRule('tx-discovery-response');

    it('adds 30 calendar days from discovery served date', () => {
      const served = new Date('2026-03-01');
      const deadline = calculateDeadline(served, rule);
      expect(fmt(deadline)).toBe('2026-03-31');
    });

    it('crosses year boundary', () => {
      const served = new Date('2025-12-15');
      const deadline = calculateDeadline(served, rule);
      expect(fmt(deadline)).toBe('2026-01-14');
    });
  });

  // -------------------------------------------------------------------------
  // calculateDeadline -- Discovery objection (15 calendar days)
  // -------------------------------------------------------------------------

  describe('Texas discovery objection deadline (15 calendar days)', () => {
    const rule = getRule('tx-discovery-objection');

    it('adds 15 calendar days from discovery served date', () => {
      const served = new Date('2026-04-01');
      const deadline = calculateDeadline(served, rule);
      expect(fmt(deadline)).toBe('2026-04-16');
    });

    it('rule is configured for CALENDAR days', () => {
      expect(rule.calendarOrBusiness).toBe('CALENDAR');
      expect(rule.daysFromTrigger).toBe(15);
    });
  });

  // -------------------------------------------------------------------------
  // calculateDeadline -- SAPCR temp orders (14 calendar days)
  // -------------------------------------------------------------------------

  describe('SAPCR temporary orders hearing (14 calendar days)', () => {
    const rule = getRule('tx-sapcr-temp-orders-hearing');

    it('adds 14 calendar days from request date', () => {
      const requested = new Date('2026-05-01');
      const deadline = calculateDeadline(requested, rule);
      expect(fmt(deadline)).toBe('2026-05-15');
    });

    it('applies to SAPCR and DIVORCE_WITH_CHILDREN matter types', () => {
      expect(rule.applicableMatterTypes).toContain('SAPCR');
      expect(rule.applicableMatterTypes).toContain('DIVORCE_WITH_CHILDREN');
    });

    it('trigger event is TEMP_ORDERS_REQUESTED', () => {
      expect(rule.triggerEvent).toBe('TEMP_ORDERS_REQUESTED');
    });
  });

  // -------------------------------------------------------------------------
  // calculateDeadline -- Modification answer (20 days + Monday)
  // -------------------------------------------------------------------------

  describe('Motion to modify answer deadline (20 days + next Monday)', () => {
    const rule = getRule('tx-motion-modify-answer');

    it('20 calendar days + next Monday from service', () => {
      // Service on 2026-02-02 (Monday). +20 = 2026-02-22 (Sunday).
      // Next Monday = 2026-02-23.
      const served = new Date('2026-02-02');
      const deadline = calculateDeadline(served, rule);
      expect(deadline.getDay()).toBe(1); // Monday
      expect(fmt(deadline)).toBe('2026-02-23');
    });

    it('applies to MODIFICATION and SAPCR_MODIFICATION', () => {
      expect(rule.applicableMatterTypes).toContain('MODIFICATION');
      expect(rule.applicableMatterTypes).toContain('SAPCR_MODIFICATION');
    });
  });

  // -------------------------------------------------------------------------
  // TEXAS_DEADLINE_RULES registry
  // -------------------------------------------------------------------------

  describe('TEXAS_DEADLINE_RULES', () => {
    it('contains 6 rules', () => {
      expect(TEXAS_DEADLINE_RULES).toHaveLength(6);
    });

    it('every rule has a unique id', () => {
      const ids = TEXAS_DEADLINE_RULES.map((r) => r.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
