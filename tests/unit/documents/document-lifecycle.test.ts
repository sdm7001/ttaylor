import { describe, it, expect } from 'vitest';
import { DocumentLifecycle } from '@ttaylor/domain';
import {
  VALID_DOCUMENT_TRANSITIONS,
  ATTORNEY_ONLY_DOCUMENT_TRANSITIONS,
  validateDocumentTransition,
  isDocumentFileable,
} from '../../../packages/documents/src/document-lifecycle';

describe('document-lifecycle', () => {
  // -------------------------------------------------------------------------
  // Valid transitions
  // -------------------------------------------------------------------------

  describe('valid transitions', () => {
    it('DRAFT -> GENERATING is valid', () => {
      const result = validateDocumentTransition(DocumentLifecycle.DRAFT, DocumentLifecycle.GENERATING);
      expect(result.valid).toBe(true);
    });

    it('GENERATING -> GENERATED is valid', () => {
      const result = validateDocumentTransition(DocumentLifecycle.GENERATING, DocumentLifecycle.GENERATED);
      expect(result.valid).toBe(true);
    });

    it('GENERATED -> INTERNAL_REVIEW is valid', () => {
      const result = validateDocumentTransition(DocumentLifecycle.GENERATED, DocumentLifecycle.INTERNAL_REVIEW);
      expect(result.valid).toBe(true);
    });

    it('GENERATED -> ATTORNEY_REVIEW is valid', () => {
      const result = validateDocumentTransition(DocumentLifecycle.GENERATED, DocumentLifecycle.ATTORNEY_REVIEW);
      expect(result.valid).toBe(true);
    });

    it('INTERNAL_REVIEW -> ATTORNEY_REVIEW is valid', () => {
      const result = validateDocumentTransition(DocumentLifecycle.INTERNAL_REVIEW, DocumentLifecycle.ATTORNEY_REVIEW);
      expect(result.valid).toBe(true);
    });

    it('INTERNAL_REVIEW -> REVISION_NEEDED is valid', () => {
      const result = validateDocumentTransition(DocumentLifecycle.INTERNAL_REVIEW, DocumentLifecycle.REVISION_NEEDED);
      expect(result.valid).toBe(true);
    });

    it('ATTORNEY_REVIEW -> ATTORNEY_APPROVED is valid', () => {
      const result = validateDocumentTransition(DocumentLifecycle.ATTORNEY_REVIEW, DocumentLifecycle.ATTORNEY_APPROVED);
      expect(result.valid).toBe(true);
    });

    it('ATTORNEY_REVIEW -> REJECTED is valid', () => {
      const result = validateDocumentTransition(DocumentLifecycle.ATTORNEY_REVIEW, DocumentLifecycle.REJECTED);
      expect(result.valid).toBe(true);
    });

    it('ATTORNEY_REVIEW -> REVISION_NEEDED is valid', () => {
      const result = validateDocumentTransition(DocumentLifecycle.ATTORNEY_REVIEW, DocumentLifecycle.REVISION_NEEDED);
      expect(result.valid).toBe(true);
    });

    it('REVISION_NEEDED -> DRAFT is valid', () => {
      const result = validateDocumentTransition(DocumentLifecycle.REVISION_NEEDED, DocumentLifecycle.DRAFT);
      expect(result.valid).toBe(true);
    });

    it('ATTORNEY_APPROVED -> SIGNED is valid', () => {
      const result = validateDocumentTransition(DocumentLifecycle.ATTORNEY_APPROVED, DocumentLifecycle.SIGNED);
      expect(result.valid).toBe(true);
    });

    it('ATTORNEY_APPROVED -> FILED is valid', () => {
      const result = validateDocumentTransition(DocumentLifecycle.ATTORNEY_APPROVED, DocumentLifecycle.FILED);
      expect(result.valid).toBe(true);
    });

    it('SIGNED -> FILED is valid', () => {
      const result = validateDocumentTransition(DocumentLifecycle.SIGNED, DocumentLifecycle.FILED);
      expect(result.valid).toBe(true);
    });

    it('REJECTED -> DRAFT is valid (restart)', () => {
      const result = validateDocumentTransition(DocumentLifecycle.REJECTED, DocumentLifecycle.DRAFT);
      expect(result.valid).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Invalid transitions
  // -------------------------------------------------------------------------

  describe('invalid transitions', () => {
    it('DRAFT -> FILED is not valid (skips entire lifecycle)', () => {
      const result = validateDocumentTransition(DocumentLifecycle.DRAFT, DocumentLifecycle.FILED);
      expect(result.valid).toBe(false);
    });

    it('FILED -> DRAFT is not valid (terminal state)', () => {
      const result = validateDocumentTransition(DocumentLifecycle.FILED, DocumentLifecycle.DRAFT);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('terminal');
    });

    it('GENERATING -> ATTORNEY_APPROVED is not valid', () => {
      const result = validateDocumentTransition(DocumentLifecycle.GENERATING, DocumentLifecycle.ATTORNEY_APPROVED);
      expect(result.valid).toBe(false);
    });

    it('ATTORNEY_APPROVED -> DRAFT is not valid', () => {
      const result = validateDocumentTransition(DocumentLifecycle.ATTORNEY_APPROVED, DocumentLifecycle.DRAFT);
      expect(result.valid).toBe(false);
    });

    it('SIGNED -> DRAFT is not valid', () => {
      const result = validateDocumentTransition(DocumentLifecycle.SIGNED, DocumentLifecycle.DRAFT);
      expect(result.valid).toBe(false);
    });

    it('invalid transition reason includes valid targets', () => {
      const result = validateDocumentTransition(DocumentLifecycle.DRAFT, DocumentLifecycle.FILED);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('GENERATING');
    });
  });

  // -------------------------------------------------------------------------
  // isDocumentFileable
  // -------------------------------------------------------------------------

  describe('isDocumentFileable', () => {
    it('returns true for ATTORNEY_APPROVED', () => {
      expect(isDocumentFileable(DocumentLifecycle.ATTORNEY_APPROVED)).toBe(true);
    });

    it('returns false for DRAFT', () => {
      expect(isDocumentFileable(DocumentLifecycle.DRAFT)).toBe(false);
    });

    it('returns false for GENERATED', () => {
      expect(isDocumentFileable(DocumentLifecycle.GENERATED)).toBe(false);
    });

    it('returns false for ATTORNEY_REVIEW', () => {
      expect(isDocumentFileable(DocumentLifecycle.ATTORNEY_REVIEW)).toBe(false);
    });

    it('returns false for REJECTED', () => {
      expect(isDocumentFileable(DocumentLifecycle.REJECTED)).toBe(false);
    });

    it('returns false for SIGNED', () => {
      expect(isDocumentFileable(DocumentLifecycle.SIGNED)).toBe(false);
    });

    it('returns false for FILED', () => {
      expect(isDocumentFileable(DocumentLifecycle.FILED)).toBe(false);
    });

    it('returns false for all states except ATTORNEY_APPROVED', () => {
      const allStates = Object.values(DocumentLifecycle);
      for (const state of allStates) {
        if (state === DocumentLifecycle.ATTORNEY_APPROVED) continue;
        expect(isDocumentFileable(state)).toBe(false);
      }
    });
  });

  // -------------------------------------------------------------------------
  // ATTORNEY_ONLY_DOCUMENT_TRANSITIONS
  // -------------------------------------------------------------------------

  describe('ATTORNEY_ONLY_DOCUMENT_TRANSITIONS', () => {
    it('contains ATTORNEY_APPROVED', () => {
      expect(ATTORNEY_ONLY_DOCUMENT_TRANSITIONS.has(DocumentLifecycle.ATTORNEY_APPROVED)).toBe(true);
    });

    it('contains REJECTED', () => {
      expect(ATTORNEY_ONLY_DOCUMENT_TRANSITIONS.has(DocumentLifecycle.REJECTED)).toBe(true);
    });

    it('does not contain DRAFT', () => {
      expect(ATTORNEY_ONLY_DOCUMENT_TRANSITIONS.has(DocumentLifecycle.DRAFT)).toBe(false);
    });

    it('does not contain FILED', () => {
      expect(ATTORNEY_ONLY_DOCUMENT_TRANSITIONS.has(DocumentLifecycle.FILED)).toBe(false);
    });

    it('has exactly 2 entries', () => {
      expect(ATTORNEY_ONLY_DOCUMENT_TRANSITIONS.size).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // Terminal state
  // -------------------------------------------------------------------------

  describe('terminal state', () => {
    it('FILED has no valid transitions', () => {
      expect(VALID_DOCUMENT_TRANSITIONS[DocumentLifecycle.FILED]).toEqual([]);
    });
  });
});
