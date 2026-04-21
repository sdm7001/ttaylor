/**
 * @ttaylor/documents -- Document automation and lifecycle management.
 *
 * Provides template rendering (Handlebars), merge field validation,
 * and document lifecycle state machine helpers for the Ttaylor
 * Family Law platform.
 */
export {
  type MergeField,
  STANDARD_MERGE_FIELDS,
  renderTemplate,
  validateMergeData,
} from './template-engine';

export {
  VALID_DOCUMENT_TRANSITIONS,
  ATTORNEY_ONLY_DOCUMENT_TRANSITIONS,
  validateDocumentTransition,
  isDocumentFileable,
} from './document-lifecycle';
