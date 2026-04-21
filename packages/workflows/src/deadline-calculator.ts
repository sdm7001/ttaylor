/**
 * Texas Family Code deadline calculator.
 *
 * Provides date arithmetic for statutory deadlines commonly encountered
 * in Texas family law matters -- waiting periods, answer deadlines,
 * discovery responses, etc.
 *
 * NOTE: `addBusinessDays` currently skips weekends (Sat/Sun) only.
 * Texas state courts also observe federal holidays. A future enhancement
 * should integrate a holiday calendar for full accuracy. Until then,
 * computed business-day deadlines may need manual adjustment around
 * major holidays (New Year's, MLK, Presidents' Day, Memorial Day,
 * Independence Day, Labor Day, Columbus Day, Veterans Day, Thanksgiving,
 * Christmas).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DeadlineRule {
  id: string;
  name: string;
  description: string;
  daysFromTrigger: number;
  calendarOrBusiness: 'CALENDAR' | 'BUSINESS';
  triggerEvent: string;
  applicableMatterTypes: string[];
}

// ---------------------------------------------------------------------------
// Built-in Texas deadline rules
// ---------------------------------------------------------------------------

export const TEXAS_DEADLINE_RULES: DeadlineRule[] = [
  {
    id: 'tx-divorce-60-day-wait',
    name: 'Divorce 60-Day Waiting Period',
    description:
      'Texas Family Code Sec. 6.702 -- Court may not grant a divorce before the 60th day after the suit was filed.',
    daysFromTrigger: 60,
    calendarOrBusiness: 'CALENDAR',
    triggerEvent: 'PETITION_FILED',
    applicableMatterTypes: ['DIVORCE', 'DIVORCE_NO_CHILDREN', 'DIVORCE_WITH_CHILDREN'],
  },
  {
    id: 'tx-answer-deadline',
    name: 'Answer Deadline (20 days + Monday)',
    description:
      'Texas Rules of Civil Procedure Rule 99 -- Defendant must file an answer by 10:00 AM on the first Monday after 20 days from date of service.',
    daysFromTrigger: 20,
    calendarOrBusiness: 'CALENDAR',
    triggerEvent: 'SERVICE_COMPLETED',
    applicableMatterTypes: [],
  },
  {
    id: 'tx-discovery-response',
    name: 'Discovery Response Deadline',
    description:
      'Texas Rules of Civil Procedure Rule 196/197/198 -- Party must respond to written discovery within 30 days of service.',
    daysFromTrigger: 30,
    calendarOrBusiness: 'CALENDAR',
    triggerEvent: 'DISCOVERY_SERVED',
    applicableMatterTypes: [],
  },
  {
    id: 'tx-discovery-objection',
    name: 'Discovery Objection Deadline',
    description:
      'Objections to written discovery must be served within 15 days of service of the discovery request.',
    daysFromTrigger: 15,
    calendarOrBusiness: 'CALENDAR',
    triggerEvent: 'DISCOVERY_SERVED',
    applicableMatterTypes: [],
  },
  {
    id: 'tx-sapcr-temp-orders-hearing',
    name: 'SAPCR Temporary Orders Hearing',
    description:
      'Temporary orders hearing in a SAPCR case must be set within 14 days of the request.',
    daysFromTrigger: 14,
    calendarOrBusiness: 'CALENDAR',
    triggerEvent: 'TEMP_ORDERS_REQUESTED',
    applicableMatterTypes: ['SAPCR', 'DIVORCE_WITH_CHILDREN'],
  },
  {
    id: 'tx-motion-modify-answer',
    name: 'Motion to Modify -- Answer Deadline',
    description:
      'Answer to a motion to modify is due by 10:00 AM on the first Monday after 20 days from service.',
    daysFromTrigger: 20,
    calendarOrBusiness: 'CALENDAR',
    triggerEvent: 'MODIFICATION_SERVED',
    applicableMatterTypes: ['MODIFICATION', 'SAPCR_MODIFICATION'],
  },
];

// ---------------------------------------------------------------------------
// Date arithmetic
// ---------------------------------------------------------------------------

/**
 * Add the given number of business days (weekday-only) to a date.
 *
 * Skips Saturdays (6) and Sundays (0). Does NOT account for
 * federal/state holidays -- see module-level note.
 */
export function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let remaining = days;

  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay();
    if (dow !== 0 && dow !== 6) {
      remaining -= 1;
    }
  }

  return result;
}

/**
 * Advance a date to the next Monday (or return the same date if already Monday).
 */
function nextMonday(date: Date): Date {
  const result = new Date(date);
  const dow = result.getDay();
  if (dow === 0) {
    // Sunday -> next day is Monday
    result.setDate(result.getDate() + 1);
  } else if (dow === 1) {
    // Already Monday
    return result;
  } else {
    // Tuesday(2)..Saturday(6) -> advance to next Monday
    result.setDate(result.getDate() + (8 - dow));
  }
  return result;
}

/**
 * Calculate the actual deadline date from a trigger date and a deadline rule.
 *
 * Special handling:
 *  - Answer deadline rules (tx-answer-deadline, tx-motion-modify-answer):
 *    Add daysFromTrigger calendar days, then advance to the next Monday.
 *  - Business day rules: Use addBusinessDays.
 *  - Calendar day rules: Simple date addition.
 */
export function calculateDeadline(triggerDate: Date, rule: DeadlineRule): Date {
  // Special case: Texas answer deadlines are "20 calendar days + next Monday"
  const isAnswerRule =
    rule.id === 'tx-answer-deadline' || rule.id === 'tx-motion-modify-answer';

  if (isAnswerRule) {
    const base = new Date(triggerDate);
    base.setDate(base.getDate() + rule.daysFromTrigger);
    return nextMonday(base);
  }

  if (rule.calendarOrBusiness === 'BUSINESS') {
    return addBusinessDays(triggerDate, rule.daysFromTrigger);
  }

  // Calendar days -- simple addition
  const result = new Date(triggerDate);
  result.setDate(result.getDate() + rule.daysFromTrigger);
  return result;
}
