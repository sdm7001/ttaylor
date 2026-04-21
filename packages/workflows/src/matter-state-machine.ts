/**
 * Matter status state machine.
 *
 * Encodes all valid transitions for a Texas family law matter lifecycle,
 * including attorney-gated transitions that require elevated privileges.
 *
 * Source of truth: docs/architecture/STATE-MACHINES.md
 */
import { MatterStatus } from '@ttaylor/domain';

// ---------------------------------------------------------------------------
// Valid transition map
// ---------------------------------------------------------------------------

/**
 * For each MatterStatus, the list of statuses it can legally transition to.
 * Derived from the STATE-MACHINES.md Mermaid diagram and transition table.
 */
export const VALID_MATTER_TRANSITIONS: Record<MatterStatus, MatterStatus[]> = {
  [MatterStatus.LEAD]: [MatterStatus.INTAKE],

  [MatterStatus.INTAKE]: [MatterStatus.CONFLICT_CHECK, MatterStatus.LEAD],

  [MatterStatus.CONFLICT_CHECK]: [
    MatterStatus.RETAINER_PENDING,
    MatterStatus.INTAKE,
    MatterStatus.CLOSED, // failed conflict / declined
  ],

  [MatterStatus.RETAINER_PENDING]: [
    MatterStatus.OPEN,
    MatterStatus.CONFLICT_CHECK,
  ],

  [MatterStatus.OPEN]: [
    MatterStatus.ACTIVE,
    MatterStatus.ON_HOLD,
    MatterStatus.CLOSED,
  ],

  [MatterStatus.ACTIVE]: [
    MatterStatus.DISCOVERY,
    MatterStatus.NEGOTIATION,
    MatterStatus.MEDIATION,
    MatterStatus.TRIAL_PREP,
    MatterStatus.ON_HOLD,
    MatterStatus.PENDING_CLOSE,
  ],

  [MatterStatus.DISCOVERY]: [
    MatterStatus.NEGOTIATION,
    MatterStatus.MEDIATION,
    MatterStatus.TRIAL_PREP,
    MatterStatus.ON_HOLD,
    MatterStatus.ACTIVE,
  ],

  [MatterStatus.NEGOTIATION]: [
    MatterStatus.MEDIATION,
    MatterStatus.TRIAL_PREP,
    MatterStatus.ACTIVE,
    MatterStatus.PENDING_CLOSE,
  ],

  [MatterStatus.MEDIATION]: [
    MatterStatus.NEGOTIATION,
    MatterStatus.TRIAL_PREP,
    MatterStatus.PENDING_CLOSE,
    MatterStatus.ACTIVE,
  ],

  [MatterStatus.TRIAL_PREP]: [MatterStatus.ACTIVE, MatterStatus.PENDING_CLOSE],

  [MatterStatus.ON_HOLD]: [
    MatterStatus.ACTIVE,
    MatterStatus.OPEN,
    MatterStatus.CLOSED,
  ],

  [MatterStatus.PENDING_CLOSE]: [MatterStatus.CLOSED, MatterStatus.ACTIVE],

  [MatterStatus.CLOSED]: [MatterStatus.ARCHIVED],

  [MatterStatus.ARCHIVED]: [],
};

// ---------------------------------------------------------------------------
// Attorney-gated transitions
// ---------------------------------------------------------------------------

/**
 * Statuses that require the ATTORNEY role to enter. These are hard gates --
 * no other role can transition a matter into these statuses.
 */
export const ATTORNEY_REQUIRED_TRANSITIONS: Set<MatterStatus> = new Set([
  MatterStatus.CLOSED,
  MatterStatus.ARCHIVED,
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Validate whether a transition from `from` to `to` is allowed.
 *
 * Returns `{ valid: true }` if the transition is legal,
 * or `{ valid: false, reason: string }` if it is not.
 */
export function validateMatterTransition(
  from: MatterStatus,
  to: MatterStatus,
): { valid: boolean; reason?: string } {
  const allowed = VALID_MATTER_TRANSITIONS[from];
  if (!allowed) {
    return { valid: false, reason: `Unknown source status: '${from}'` };
  }

  if (!allowed.includes(to)) {
    return {
      valid: false,
      reason: `Cannot transition from '${from}' to '${to}'. Allowed targets: ${allowed.join(', ') || '(none)'}`,
    };
  }

  return { valid: true };
}

/**
 * Return the list of statuses reachable from the given status.
 */
export function getAvailableTransitions(from: MatterStatus): MatterStatus[] {
  return VALID_MATTER_TRANSITIONS[from] ?? [];
}
