import { describe, it, expect } from 'vitest';
import {
  renderTemplate,
  validateMergeData,
  STANDARD_MERGE_FIELDS,
} from '../../../packages/documents/src/template-engine';

describe('template-engine', () => {
  // -------------------------------------------------------------------------
  // renderTemplate
  // -------------------------------------------------------------------------

  describe('renderTemplate', () => {
    it('renders simple merge fields', () => {
      const template = 'Hello, {{name}}!';
      const result = renderTemplate(template, { name: 'Jane Doe' });
      expect(result).toBe('Hello, Jane Doe!');
    });

    it('renders nested fields via dot notation', () => {
      const template = 'Case: {{matter.causeNumber}} in {{matter.court}}';
      const data = {
        matter: { causeNumber: '2026-12345', court: '309th District Court' },
      };
      const result = renderTemplate(template, data);
      expect(result).toBe('Case: 2026-12345 in 309th District Court');
    });

    it('renders deeply nested fields', () => {
      const template = '{{a.b.c}}';
      const result = renderTemplate(template, { a: { b: { c: 'deep' } } });
      expect(result).toBe('deep');
    });

    it('renders missing fields as empty string (strict: false)', () => {
      const template = 'Hello, {{name}}! Your case is {{causeNumber}}.';
      const result = renderTemplate(template, { name: 'Jane' });
      expect(result).toBe('Hello, Jane! Your case is .');
    });

    it('does not HTML-escape content (noEscape: true)', () => {
      const template = '{{content}}';
      const result = renderTemplate(template, { content: '<b>bold</b>' });
      expect(result).toBe('<b>bold</b>');
    });

    it('renders multiple fields from same object', () => {
      const template = '{{petitioner.firstName}} {{petitioner.lastName}}';
      const data = { petitioner: { firstName: 'Jane', lastName: 'Smith' } };
      const result = renderTemplate(template, data);
      expect(result).toBe('Jane Smith');
    });

    it('renders template with no merge fields', () => {
      const template = 'This is a static document with no variables.';
      const result = renderTemplate(template, {});
      expect(result).toBe('This is a static document with no variables.');
    });

    it('handles empty data object gracefully', () => {
      const template = 'Name: {{name}}';
      const result = renderTemplate(template, {});
      expect(result).toBe('Name: ');
    });
  });

  // -------------------------------------------------------------------------
  // validateMergeData
  // -------------------------------------------------------------------------

  describe('validateMergeData', () => {
    it('returns valid when all fields are present', () => {
      const template = '{{name}} - {{court}}';
      const data = { name: 'Jane', court: '309th District Court' };
      const result = validateMergeData(template, data);
      expect(result.valid).toBe(true);
      expect(result.missingFields).toEqual([]);
    });

    it('lists missing fields correctly', () => {
      const template = '{{name}} in {{court}} before {{judge}}';
      const data = { name: 'Jane' };
      const result = validateMergeData(template, data);
      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('court');
      expect(result.missingFields).toContain('judge');
      expect(result.missingFields).not.toContain('name');
    });

    it('handles nested key validation', () => {
      const template = '{{petitioner.firstName}} vs {{respondent.firstName}}';
      const data = {
        petitioner: { firstName: 'Jane' },
        respondent: { firstName: '' }, // empty string counts as missing
      };
      const result = validateMergeData(template, data);
      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('respondent.firstName');
    });

    it('returns valid for template with no fields', () => {
      const template = 'This document has no merge fields.';
      const result = validateMergeData(template, {});
      expect(result.valid).toBe(true);
      expect(result.missingFields).toEqual([]);
    });

    it('treats null values as missing', () => {
      const template = '{{name}}';
      const data = { name: null };
      const result = validateMergeData(template, data as Record<string, unknown>);
      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('name');
    });

    it('treats undefined nested paths as missing', () => {
      const template = '{{person.name}}';
      const data = {};
      const result = validateMergeData(template, data);
      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('person.name');
    });

    it('does not flag block helper keywords as missing fields', () => {
      const template = '{{#if showSection}}content{{/if}} by {{author}}';
      const data = { author: 'Jane' };
      const result = validateMergeData(template, data);
      expect(result.valid).toBe(true);
      expect(result.missingFields).not.toContain('if');
    });
  });

  // -------------------------------------------------------------------------
  // STANDARD_MERGE_FIELDS
  // -------------------------------------------------------------------------

  describe('STANDARD_MERGE_FIELDS', () => {
    it('has at least 15 entries', () => {
      expect(STANDARD_MERGE_FIELDS.length).toBeGreaterThanOrEqual(15);
    });

    it('covers the matter category', () => {
      const matterFields = STANDARD_MERGE_FIELDS.filter((f) => f.category === 'matter');
      expect(matterFields.length).toBeGreaterThanOrEqual(1);
    });

    it('covers the petitioner category', () => {
      const fields = STANDARD_MERGE_FIELDS.filter((f) => f.category === 'petitioner');
      expect(fields.length).toBeGreaterThanOrEqual(1);
    });

    it('covers the respondent category', () => {
      const fields = STANDARD_MERGE_FIELDS.filter((f) => f.category === 'respondent');
      expect(fields.length).toBeGreaterThanOrEqual(1);
    });

    it('covers the attorney category', () => {
      const fields = STANDARD_MERGE_FIELDS.filter((f) => f.category === 'attorney');
      expect(fields.length).toBeGreaterThanOrEqual(1);
    });

    it('covers the child category', () => {
      const fields = STANDARD_MERGE_FIELDS.filter((f) => f.category === 'child');
      expect(fields.length).toBeGreaterThanOrEqual(1);
    });

    it('covers the childSupport category', () => {
      const fields = STANDARD_MERGE_FIELDS.filter((f) => f.category === 'childSupport');
      expect(fields.length).toBeGreaterThanOrEqual(1);
    });

    it('covers the today category', () => {
      const fields = STANDARD_MERGE_FIELDS.filter((f) => f.category === 'today');
      expect(fields.length).toBeGreaterThanOrEqual(1);
    });

    it('every field has a non-empty key, label, and description', () => {
      for (const field of STANDARD_MERGE_FIELDS) {
        expect(field.key.length).toBeGreaterThan(0);
        expect(field.label.length).toBeGreaterThan(0);
        expect(field.description.length).toBeGreaterThan(0);
      }
    });

    it('has unique keys', () => {
      const keys = STANDARD_MERGE_FIELDS.map((f) => f.key);
      expect(new Set(keys).size).toBe(keys.length);
    });
  });
});
