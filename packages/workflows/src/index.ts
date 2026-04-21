/**
 * @ttaylor/workflows -- barrel export.
 *
 * Provides matter state machine, checklist engine, and
 * Texas Family Code deadline calculator.
 */

// Matter state machine
export {
  VALID_MATTER_TRANSITIONS,
  ATTORNEY_REQUIRED_TRANSITIONS,
  validateMatterTransition,
  getAvailableTransitions,
} from './matter-state-machine';

// Checklist engine
export {
  createChecklistInstance,
  canCompleteItem,
  computeChecklistProgress,
} from './checklist-engine';
export type {
  ChecklistTemplateDefinition,
  ChecklistTemplateItemDefinition,
  ChecklistItemInstanceData,
  ChecklistItemInstanceStatus,
  ChecklistInstanceData,
} from './checklist-engine';

// Deadline calculator
export {
  TEXAS_DEADLINE_RULES,
  calculateDeadline,
  addBusinessDays,
} from './deadline-calculator';
export type { DeadlineRule } from './deadline-calculator';
