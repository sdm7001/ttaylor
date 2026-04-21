/**
 * Document lifecycle state machine helpers.
 *
 * Defines valid transitions, attorney-only gates, and utility
 * functions for the document review and approval workflow.
 */
import { DocumentLifecycle } from '@ttaylor/domain';

// ---------------------------------------------------------------------------
// Valid transitions
// ---------------------------------------------------------------------------

/**
 * Map of each document lifecycle state to its valid successor states.
 *
 * Transition rules (from ADR-003 + extended lifecycle):
 * - DRAFT -> GENERATING
 * - GENERATING -> GENERATED
 * - GENERATED -> INTERNAL_REVIEW, ATTORNEY_REVIEW
 * - INTERNAL_REVIEW -> ATTORNEY_REVIEW, REVISION_NEEDED
 * - ATTORNEY_REVIEW -> ATTORNEY_APPROVED, REJECTED, REVISION_NEEDED
 * - REVISION_NEEDED -> DRAFT
 * - ATTORNEY_APPROVED -> SIGNED, FILED
 * - SIGNED -> FILED
 * - REJECTED -> DRAFT (can restart)
 * - FILED -> (terminal -- no transitions)
 */
export const VALID_DOCUMENT_TRANSITIONS: Record<DocumentLifecycle, DocumentLifecycle[]> = {
  [DocumentLifecycle.DRAFT]: [DocumentLifecycle.GENERATING],
  [DocumentLifecycle.GENERATING]: [DocumentLifecycle.GENERATED],
  [DocumentLifecycle.GENERATED]: [
    DocumentLifecycle.INTERNAL_REVIEW,
    DocumentLifecycle.ATTORNEY_REVIEW,
  ],
  [DocumentLifecycle.INTERNAL_REVIEW]: [
    DocumentLifecycle.ATTORNEY_REVIEW,
    DocumentLifecycle.REVISION_NEEDED,
  ],
  [DocumentLifecycle.ATTORNEY_REVIEW]: [
    DocumentLifecycle.ATTORNEY_APPROVED,
    DocumentLifecycle.REJECTED,
    DocumentLifecycle.REVISION_NEEDED,
  ],
  [DocumentLifecycle.REVISION_NEEDED]: [DocumentLifecycle.DRAFT],
  [DocumentLifecycle.ATTORNEY_APPROVED]: [
    DocumentLifecycle.SIGNED,
    DocumentLifecycle.FILED,
  ],
  [DocumentLifecycle.SIGNED]: [DocumentLifecycle.FILED],
  [DocumentLifecycle.REJECTED]: [DocumentLifecycle.DRAFT],
  [DocumentLifecycle.FILED]: [],
};

// ---------------------------------------------------------------------------
// Attorney-only transitions
// ---------------------------------------------------------------------------

/**
 * Set of lifecycle states that can ONLY be entered by a user with ATTORNEY role.
 *
 * Entering ATTORNEY_APPROVED requires the attorney to explicitly approve.
 * Entering REJECTED requires the attorney to explicitly reject.
 */
export const ATTORNEY_ONLY_DOCUMENT_TRANSITIONS: Set<DocumentLifecycle> = new Set([
  DocumentLifecycle.ATTORNEY_APPROVED,
  DocumentLifecycle.REJECTED,
]);

// ---------------------------------------------------------------------------
// Transition validation
// ---------------------------------------------------------------------------

/**
 * Validate whether a transition from one lifecycle state to another is allowed.
 *
 * @param from - Current document lifecycle state
 * @param to - Desired target state
 * @returns Object indicating validity and optional reason for rejection
 */
export function validateDocumentTransition(
  from: DocumentLifecycle,
  to: DocumentLifecycle,
): { valid: boolean; reason?: string } {
  const allowedTargets = VALID_DOCUMENT_TRANSITIONS[from];

  if (!allowedTargets) {
    return {
      valid: false,
      reason: `Unknown source state: '${from}'`,
    };
  }

  if (allowedTargets.length === 0) {
    return {
      valid: false,
      reason: `State '${from}' is terminal; no further transitions are allowed`,
    };
  }

  if (!allowedTargets.includes(to)) {
    return {
      valid: false,
      reason: `Transition from '${from}' to '${to}' is not allowed. Valid targets: ${allowedTargets.join(', ')}`,
    };
  }

  return { valid: true };
}

// ---------------------------------------------------------------------------
// Filing eligibility
// ---------------------------------------------------------------------------

/**
 * Check whether a document in the given lifecycle state is eligible
 * for inclusion in a filing packet.
 *
 * Only ATTORNEY_APPROVED documents may be filed with the court.
 */
export function isDocumentFileable(status: DocumentLifecycle): boolean {
  return status === DocumentLifecycle.ATTORNEY_APPROVED;
}
