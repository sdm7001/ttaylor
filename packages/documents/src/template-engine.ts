/**
 * Handlebars-based template engine for legal document generation.
 *
 * Provides merge field definitions, template rendering, and
 * merge data validation for the Ttaylor Family Law platform.
 */
import Handlebars from 'handlebars';

// ---------------------------------------------------------------------------
// Merge field definitions
// ---------------------------------------------------------------------------

export interface MergeField {
  key: string;
  label: string;
  description: string;
  category: string;
}

/**
 * Standard merge fields available in all document templates.
 *
 * Organized by category: matter, petitioner, respondent, attorney,
 * child, childSupport, today.
 */
export const STANDARD_MERGE_FIELDS: MergeField[] = [
  // Matter fields
  {
    key: 'matter.causeNumber',
    label: 'Cause Number',
    description: 'The court-assigned cause number for this matter',
    category: 'matter',
  },
  {
    key: 'matter.court',
    label: 'Court',
    description: 'The court name (e.g., "309th District Court, Harris County, Texas")',
    category: 'matter',
  },
  {
    key: 'matter.judge',
    label: 'Judge',
    description: 'The presiding judge name',
    category: 'matter',
  },

  // Petitioner fields
  {
    key: 'petitioner.firstName',
    label: 'Petitioner First Name',
    description: 'First name of the petitioner',
    category: 'petitioner',
  },
  {
    key: 'petitioner.lastName',
    label: 'Petitioner Last Name',
    description: 'Last name of the petitioner',
    category: 'petitioner',
  },
  {
    key: 'petitioner.fullName',
    label: 'Petitioner Full Name',
    description: 'Full name of the petitioner (first + last)',
    category: 'petitioner',
  },

  // Respondent fields
  {
    key: 'respondent.firstName',
    label: 'Respondent First Name',
    description: 'First name of the respondent',
    category: 'respondent',
  },
  {
    key: 'respondent.lastName',
    label: 'Respondent Last Name',
    description: 'Last name of the respondent',
    category: 'respondent',
  },
  {
    key: 'respondent.fullName',
    label: 'Respondent Full Name',
    description: 'Full name of the respondent (first + last)',
    category: 'respondent',
  },

  // Attorney fields
  {
    key: 'attorney.firstName',
    label: 'Attorney First Name',
    description: 'First name of the assigned attorney',
    category: 'attorney',
  },
  {
    key: 'attorney.lastName',
    label: 'Attorney Last Name',
    description: 'Last name of the assigned attorney',
    category: 'attorney',
  },
  {
    key: 'attorney.barNumber',
    label: 'Attorney Bar Number',
    description: 'Texas State Bar number of the assigned attorney',
    category: 'attorney',
  },

  // Date fields
  {
    key: 'today.date',
    label: 'Today (Full)',
    description: 'Current date in long format (e.g., "April 21, 2026")',
    category: 'today',
  },
  {
    key: 'today.dateShort',
    label: 'Today (Short)',
    description: 'Current date in short format (e.g., "04/21/2026")',
    category: 'today',
  },
  {
    key: 'today.year',
    label: 'Current Year',
    description: 'Current four-digit year (e.g., "2026")',
    category: 'today',
  },

  // Child fields (for SAPCR matters)
  {
    key: 'child.firstName',
    label: 'Child First Name',
    description: 'First name of the child (SAPCR and custody matters)',
    category: 'child',
  },
  {
    key: 'child.lastName',
    label: 'Child Last Name',
    description: 'Last name of the child (SAPCR and custody matters)',
    category: 'child',
  },
  {
    key: 'child.dateOfBirth',
    label: 'Child Date of Birth',
    description: 'Date of birth of the child',
    category: 'child',
  },

  // Child support fields
  {
    key: 'childSupport.monthlyAmount',
    label: 'Monthly Support Amount',
    description: 'Court-ordered monthly child support payment amount',
    category: 'childSupport',
  },
  {
    key: 'childSupport.paymentDay',
    label: 'Payment Day',
    description: 'Day of the month support payment is due',
    category: 'childSupport',
  },
  {
    key: 'childSupport.obligor',
    label: 'Support Obligor',
    description: 'Name of the party obligated to pay child support',
    category: 'childSupport',
  },
];

// ---------------------------------------------------------------------------
// Template rendering
// ---------------------------------------------------------------------------

/**
 * Render a Handlebars template with the provided merge data.
 *
 * @param templateContent - The Handlebars template string
 * @param mergeData - Key-value pairs for template variables (supports nested objects via dot notation)
 * @returns The rendered document content
 */
export function renderTemplate(
  templateContent: string,
  mergeData: Record<string, unknown>,
): string {
  const compiled = Handlebars.compile(templateContent, {
    strict: false,
    noEscape: true, // Legal documents may contain HTML; do not escape
  });
  return compiled(mergeData);
}

// ---------------------------------------------------------------------------
// Merge data validation
// ---------------------------------------------------------------------------

/**
 * Regular expression to extract Handlebars variable references from a template.
 *
 * Matches:
 * - Simple: {{variableName}}
 * - Dotted: {{object.property}}
 * - Inside blocks: references within #if, #each, #unless, #with
 *
 * Does NOT match:
 * - Block helpers themselves (#if, #each, /if, /each, etc.)
 * - Comments: {{! comment }}
 * - Partials: {{> partialName }}
 */
const MERGE_FIELD_REGEX = /\{\{(?!#|\/|!|>)\s*([a-zA-Z_][a-zA-Z0-9_.[\]]*)\s*\}\}/g;

/**
 * Extract all merge field references from a Handlebars template.
 *
 * @param templateContent - The template string to analyze
 * @returns Array of unique field keys referenced in the template
 */
function extractMergeFieldKeys(templateContent: string): string[] {
  const keys = new Set<string>();
  let match: RegExpExecArray | null;

  // Reset regex lastIndex for safety
  MERGE_FIELD_REGEX.lastIndex = 0;

  while ((match = MERGE_FIELD_REGEX.exec(templateContent)) !== null) {
    keys.add(match[1]);
  }

  return Array.from(keys);
}

/**
 * Resolve a dotted key path against a nested object.
 *
 * @example
 * resolveKeyPath('petitioner.firstName', { petitioner: { firstName: 'Jane' } })
 * // => 'Jane'
 */
function resolveKeyPath(key: string, data: Record<string, unknown>): unknown {
  const parts = key.split('.');
  let current: unknown = data;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Validate that all merge fields referenced in a template exist in the provided data.
 *
 * @param templateContent - The Handlebars template to validate against
 * @param mergeData - The data object to check for completeness
 * @returns Validation result with list of missing fields
 */
export function validateMergeData(
  templateContent: string,
  mergeData: Record<string, unknown>,
): { valid: boolean; missingFields: string[] } {
  const keys = extractMergeFieldKeys(templateContent);
  const missingFields: string[] = [];

  for (const key of keys) {
    const value = resolveKeyPath(key, mergeData);
    if (value === undefined || value === null || value === '') {
      missingFields.push(key);
    }
  }

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}
