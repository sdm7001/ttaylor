/**
 * Checklist engine.
 *
 * Provides pure-logic utilities for creating checklist instances from
 * templates, validating whether a user can complete an item, and
 * computing progress statistics.
 */

// ---------------------------------------------------------------------------
// Template-level types (what the admin configures)
// ---------------------------------------------------------------------------

export interface ChecklistTemplateDefinition {
  id: string;
  name: string;
  matterTypeId: string;
  items: ChecklistTemplateItemDefinition[];
}

export interface ChecklistTemplateItemDefinition {
  id: string;
  title: string;
  description?: string;
  requiredRole?: string;
  order: number;
  dependsOnItemIds: string[];
  isAttorneyReview: boolean;
  isMandatory: boolean;
}

// ---------------------------------------------------------------------------
// Instance-level types (runtime state of a checklist for a specific matter)
// ---------------------------------------------------------------------------

export type ChecklistItemInstanceStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'NEEDS_REVIEW'
  | 'ATTORNEY_REVIEW'
  | 'COMPLETED'
  | 'WAIVED'
  | 'SKIPPED';

export interface ChecklistItemInstanceData {
  id: string;
  templateItemId: string;
  checklistInstanceId: string;
  title: string;
  description?: string;
  status: ChecklistItemInstanceStatus;
  requiredRole?: string;
  order: number;
  dependsOnItemIds: string[];
  isAttorneyReview: boolean;
  isMandatory: boolean;
  completedAt?: Date;
  completedById?: string;
  notes?: string;
}

export interface ChecklistInstanceData {
  id: string;
  matterId: string;
  templateId: string;
  items: ChecklistItemInstanceData[];
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Engine functions
// ---------------------------------------------------------------------------

let idCounter = 0;
function generateId(): string {
  idCounter += 1;
  return `cli_${Date.now()}_${idCounter}`;
}

/**
 * Create a checklist instance (with item instances) from a template definition.
 *
 * Each template item becomes an instance item. Items whose dependencies are
 * not yet met start in BLOCKED status; others start as NOT_STARTED.
 */
export function createChecklistInstance(
  template: ChecklistTemplateDefinition,
  matterId: string,
): ChecklistInstanceData {
  const instanceId = generateId();

  // Build all item instances first (all NOT_STARTED by default)
  const items: ChecklistItemInstanceData[] = template.items
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((tItem) => ({
      id: generateId(),
      templateItemId: tItem.id,
      checklistInstanceId: instanceId,
      title: tItem.title,
      description: tItem.description,
      status: 'NOT_STARTED' as ChecklistItemInstanceStatus,
      requiredRole: tItem.requiredRole,
      order: tItem.order,
      dependsOnItemIds: tItem.dependsOnItemIds,
      isAttorneyReview: tItem.isAttorneyReview,
      isMandatory: tItem.isMandatory,
    }));

  // Mark items with unmet dependencies as BLOCKED
  const completedTemplateItemIds = new Set<string>();
  for (const item of items) {
    if (item.dependsOnItemIds.length > 0) {
      const allDependenciesMet = item.dependsOnItemIds.every((depId) =>
        completedTemplateItemIds.has(depId),
      );
      if (!allDependenciesMet) {
        item.status = 'BLOCKED';
      }
    }
    // At creation time nothing is completed, so only items with no
    // dependencies remain NOT_STARTED; the rest are BLOCKED.
  }

  return {
    id: instanceId,
    matterId,
    templateId: template.id,
    items,
    createdAt: new Date(),
  };
}

/**
 * Determine whether a user with the given roles can complete the specified
 * checklist item, considering both role requirements and dependency state.
 */
export function canCompleteItem(
  item: ChecklistItemInstanceData,
  allItems: ChecklistItemInstanceData[],
  userRoles: string[],
): { canComplete: boolean; reason?: string } {
  // Terminal states cannot be completed again
  if (item.status === 'COMPLETED' || item.status === 'WAIVED' || item.status === 'SKIPPED') {
    return { canComplete: false, reason: `Item is already in terminal status '${item.status}'` };
  }

  // Check dependencies: all items this depends on must be COMPLETED or WAIVED
  if (item.dependsOnItemIds.length > 0) {
    const terminalStatuses: ChecklistItemInstanceStatus[] = ['COMPLETED', 'WAIVED'];
    const unmetDeps = item.dependsOnItemIds.filter((depTemplateId) => {
      const depItem = allItems.find((i) => i.templateItemId === depTemplateId);
      return !depItem || !terminalStatuses.includes(depItem.status);
    });

    if (unmetDeps.length > 0) {
      return {
        canComplete: false,
        reason: `Blocked by ${unmetDeps.length} unmet dependency item(s)`,
      };
    }
  }

  // Check attorney review requirement
  if (item.isAttorneyReview && !userRoles.includes('ATTORNEY')) {
    return {
      canComplete: false,
      reason: 'This item requires attorney review -- only ATTORNEY role can complete it',
    };
  }

  // Check required role
  if (item.requiredRole && !userRoles.includes(item.requiredRole)) {
    return {
      canComplete: false,
      reason: `Requires role '${item.requiredRole}' -- you do not have it`,
    };
  }

  return { canComplete: true };
}

/**
 * Compute progress statistics for a list of checklist item instances.
 */
export function computeChecklistProgress(items: ChecklistItemInstanceData[]): {
  total: number;
  completed: number;
  blocked: number;
  percent: number;
} {
  const total = items.length;
  const completed = items.filter(
    (i) => i.status === 'COMPLETED' || i.status === 'WAIVED' || i.status === 'SKIPPED',
  ).length;
  const blocked = items.filter((i) => i.status === 'BLOCKED').length;
  const percent = total === 0 ? 100 : Math.round((completed / total) * 100);

  return { total, completed, blocked, percent };
}
