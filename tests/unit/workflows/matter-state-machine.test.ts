import { describe, it, expect } from 'vitest';
import { MatterStatus } from '@ttaylor/domain';
import {
  VALID_MATTER_TRANSITIONS,
  ATTORNEY_REQUIRED_TRANSITIONS,
  validateMatterTransition,
  getAvailableTransitions,
} from '../../../packages/workflows/src/matter-state-machine';

// ---------------------------------------------------------------------------
// Valid transitions
// ---------------------------------------------------------------------------

describe('matter-state-machine', () => {
  describe('valid transitions', () => {
    it('LEAD -> INTAKE is valid', () => {
      const result = validateMatterTransition(MatterStatus.LEAD, MatterStatus.INTAKE);
      expect(result.valid).toBe(true);
    });

    it('INTAKE -> CONFLICT_CHECK is valid', () => {
      const result = validateMatterTransition(MatterStatus.INTAKE, MatterStatus.CONFLICT_CHECK);
      expect(result.valid).toBe(true);
    });

    it('INTAKE -> LEAD is valid (regression to lead)', () => {
      const result = validateMatterTransition(MatterStatus.INTAKE, MatterStatus.LEAD);
      expect(result.valid).toBe(true);
    });

    it('CONFLICT_CHECK -> RETAINER_PENDING is valid', () => {
      const result = validateMatterTransition(MatterStatus.CONFLICT_CHECK, MatterStatus.RETAINER_PENDING);
      expect(result.valid).toBe(true);
    });

    it('CONFLICT_CHECK -> CLOSED is valid (declined)', () => {
      const result = validateMatterTransition(MatterStatus.CONFLICT_CHECK, MatterStatus.CLOSED);
      expect(result.valid).toBe(true);
    });

    it('RETAINER_PENDING -> OPEN is valid', () => {
      const result = validateMatterTransition(MatterStatus.RETAINER_PENDING, MatterStatus.OPEN);
      expect(result.valid).toBe(true);
    });

    it('OPEN -> ACTIVE is valid', () => {
      const result = validateMatterTransition(MatterStatus.OPEN, MatterStatus.ACTIVE);
      expect(result.valid).toBe(true);
    });

    it('ACTIVE -> DISCOVERY is valid', () => {
      const result = validateMatterTransition(MatterStatus.ACTIVE, MatterStatus.DISCOVERY);
      expect(result.valid).toBe(true);
    });

    it('ACTIVE -> NEGOTIATION is valid', () => {
      const result = validateMatterTransition(MatterStatus.ACTIVE, MatterStatus.NEGOTIATION);
      expect(result.valid).toBe(true);
    });

    it('ACTIVE -> MEDIATION is valid', () => {
      const result = validateMatterTransition(MatterStatus.ACTIVE, MatterStatus.MEDIATION);
      expect(result.valid).toBe(true);
    });

    it('ACTIVE -> TRIAL_PREP is valid', () => {
      const result = validateMatterTransition(MatterStatus.ACTIVE, MatterStatus.TRIAL_PREP);
      expect(result.valid).toBe(true);
    });

    it('ACTIVE -> ON_HOLD is valid', () => {
      const result = validateMatterTransition(MatterStatus.ACTIVE, MatterStatus.ON_HOLD);
      expect(result.valid).toBe(true);
    });

    it('ACTIVE -> PENDING_CLOSE is valid', () => {
      const result = validateMatterTransition(MatterStatus.ACTIVE, MatterStatus.PENDING_CLOSE);
      expect(result.valid).toBe(true);
    });

    it('DISCOVERY -> NEGOTIATION is valid', () => {
      const result = validateMatterTransition(MatterStatus.DISCOVERY, MatterStatus.NEGOTIATION);
      expect(result.valid).toBe(true);
    });

    it('NEGOTIATION -> PENDING_CLOSE is valid', () => {
      const result = validateMatterTransition(MatterStatus.NEGOTIATION, MatterStatus.PENDING_CLOSE);
      expect(result.valid).toBe(true);
    });

    it('MEDIATION -> TRIAL_PREP is valid', () => {
      const result = validateMatterTransition(MatterStatus.MEDIATION, MatterStatus.TRIAL_PREP);
      expect(result.valid).toBe(true);
    });

    it('TRIAL_PREP -> PENDING_CLOSE is valid', () => {
      const result = validateMatterTransition(MatterStatus.TRIAL_PREP, MatterStatus.PENDING_CLOSE);
      expect(result.valid).toBe(true);
    });

    it('ON_HOLD -> ACTIVE is valid', () => {
      const result = validateMatterTransition(MatterStatus.ON_HOLD, MatterStatus.ACTIVE);
      expect(result.valid).toBe(true);
    });

    it('PENDING_CLOSE -> CLOSED is valid', () => {
      const result = validateMatterTransition(MatterStatus.PENDING_CLOSE, MatterStatus.CLOSED);
      expect(result.valid).toBe(true);
    });

    it('CLOSED -> ARCHIVED is valid', () => {
      const result = validateMatterTransition(MatterStatus.CLOSED, MatterStatus.ARCHIVED);
      expect(result.valid).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Invalid transitions
  // ---------------------------------------------------------------------------

  describe('invalid transitions', () => {
    it('LEAD -> ACTIVE is not valid (skips intake)', () => {
      const result = validateMatterTransition(MatterStatus.LEAD, MatterStatus.ACTIVE);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Cannot transition');
    });

    it('ARCHIVED -> OPEN is not valid (terminal state)', () => {
      const result = validateMatterTransition(MatterStatus.ARCHIVED, MatterStatus.OPEN);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Cannot transition');
    });

    it('CLOSED -> ACTIVE is not valid', () => {
      const result = validateMatterTransition(MatterStatus.CLOSED, MatterStatus.ACTIVE);
      expect(result.valid).toBe(false);
    });

    it('LEAD -> CLOSED is not valid', () => {
      const result = validateMatterTransition(MatterStatus.LEAD, MatterStatus.CLOSED);
      expect(result.valid).toBe(false);
    });

    it('DISCOVERY -> CLOSED is not valid', () => {
      const result = validateMatterTransition(MatterStatus.DISCOVERY, MatterStatus.CLOSED);
      expect(result.valid).toBe(false);
    });

    it('OPEN -> ARCHIVED is not valid (must close first)', () => {
      const result = validateMatterTransition(MatterStatus.OPEN, MatterStatus.ARCHIVED);
      expect(result.valid).toBe(false);
    });

    it('invalid transition result includes allowed targets in reason', () => {
      const result = validateMatterTransition(MatterStatus.LEAD, MatterStatus.CLOSED);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('INTAKE');
    });
  });

  // ---------------------------------------------------------------------------
  // Attorney-required transitions
  // ---------------------------------------------------------------------------

  describe('attorney-required transitions', () => {
    it('CLOSED is an attorney-required transition target', () => {
      expect(ATTORNEY_REQUIRED_TRANSITIONS.has(MatterStatus.CLOSED)).toBe(true);
    });

    it('ARCHIVED is an attorney-required transition target', () => {
      expect(ATTORNEY_REQUIRED_TRANSITIONS.has(MatterStatus.ARCHIVED)).toBe(true);
    });

    it('ACTIVE is NOT an attorney-required transition target', () => {
      expect(ATTORNEY_REQUIRED_TRANSITIONS.has(MatterStatus.ACTIVE)).toBe(false);
    });

    it('PENDING_CLOSE -> CLOSED requires attorney (documented expectation)', () => {
      // The state machine validates that PENDING_CLOSE -> CLOSED is a valid graph edge.
      // The ATTORNEY role enforcement happens in the tRPC layer (matters router).
      // This test documents that CLOSED is in the attorney-required set.
      const transitionValid = validateMatterTransition(MatterStatus.PENDING_CLOSE, MatterStatus.CLOSED);
      expect(transitionValid.valid).toBe(true);
      expect(ATTORNEY_REQUIRED_TRANSITIONS.has(MatterStatus.CLOSED)).toBe(true);
    });

    it('OPEN is NOT an attorney-required transition target', () => {
      expect(ATTORNEY_REQUIRED_TRANSITIONS.has(MatterStatus.OPEN)).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Terminal states
  // ---------------------------------------------------------------------------

  describe('terminal states', () => {
    it('ARCHIVED has no available transitions', () => {
      const transitions = getAvailableTransitions(MatterStatus.ARCHIVED);
      expect(transitions).toEqual([]);
    });

    it('ARCHIVED has empty array in VALID_MATTER_TRANSITIONS', () => {
      expect(VALID_MATTER_TRANSITIONS[MatterStatus.ARCHIVED]).toEqual([]);
    });

    it('validation from ARCHIVED to anything returns valid: false', () => {
      const allStatuses = Object.values(MatterStatus);
      for (const status of allStatuses) {
        const result = validateMatterTransition(MatterStatus.ARCHIVED, status);
        expect(result.valid).toBe(false);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // getAvailableTransitions
  // ---------------------------------------------------------------------------

  describe('getAvailableTransitions', () => {
    it('returns [INTAKE] for LEAD', () => {
      expect(getAvailableTransitions(MatterStatus.LEAD)).toEqual([MatterStatus.INTAKE]);
    });

    it('returns multiple targets for ACTIVE', () => {
      const targets = getAvailableTransitions(MatterStatus.ACTIVE);
      expect(targets).toContain(MatterStatus.DISCOVERY);
      expect(targets).toContain(MatterStatus.ON_HOLD);
      expect(targets).toContain(MatterStatus.PENDING_CLOSE);
      expect(targets.length).toBe(6);
    });

    it('returns [CLOSED, ACTIVE] for PENDING_CLOSE', () => {
      const targets = getAvailableTransitions(MatterStatus.PENDING_CLOSE);
      expect(targets).toEqual([MatterStatus.CLOSED, MatterStatus.ACTIVE]);
    });

    it('returns [ARCHIVED] for CLOSED', () => {
      expect(getAvailableTransitions(MatterStatus.CLOSED)).toEqual([MatterStatus.ARCHIVED]);
    });

    it('returns empty for ARCHIVED', () => {
      expect(getAvailableTransitions(MatterStatus.ARCHIVED)).toEqual([]);
    });

    it('returns 3 targets for ON_HOLD', () => {
      const targets = getAvailableTransitions(MatterStatus.ON_HOLD);
      expect(targets).toContain(MatterStatus.ACTIVE);
      expect(targets).toContain(MatterStatus.OPEN);
      expect(targets).toContain(MatterStatus.CLOSED);
    });
  });
});
