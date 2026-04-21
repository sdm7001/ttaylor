import { describe, it, expect, beforeEach } from 'vitest';
import {
  createChecklistInstance,
  canCompleteItem,
  computeChecklistProgress,
  type ChecklistTemplateDefinition,
  type ChecklistItemInstanceData,
  type ChecklistItemInstanceStatus,
} from '../../../packages/workflows/src/checklist-engine';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makeTemplate(overrides?: Partial<ChecklistTemplateDefinition>): ChecklistTemplateDefinition {
  return {
    id: 'tpl-1',
    name: 'Uncontested Divorce Checklist',
    matterTypeId: 'mt-divorce',
    items: [
      {
        id: 'item-a',
        title: 'File petition',
        order: 1,
        dependsOnItemIds: [],
        isAttorneyReview: false,
        isMandatory: true,
      },
      {
        id: 'item-b',
        title: 'Serve respondent',
        order: 2,
        dependsOnItemIds: ['item-a'],
        isAttorneyReview: false,
        isMandatory: true,
      },
      {
        id: 'item-c',
        title: 'Attorney review of answer',
        order: 3,
        dependsOnItemIds: ['item-b'],
        isAttorneyReview: true,
        isMandatory: true,
        requiredRole: 'ATTORNEY',
      },
    ],
    ...overrides,
  };
}

function makeItem(overrides?: Partial<ChecklistItemInstanceData>): ChecklistItemInstanceData {
  return {
    id: 'inst-1',
    templateItemId: 'item-a',
    checklistInstanceId: 'cli-1',
    title: 'File petition',
    status: 'NOT_STARTED',
    order: 1,
    dependsOnItemIds: [],
    isAttorneyReview: false,
    isMandatory: true,
    ...overrides,
  };
}

describe('checklist-engine', () => {
  // -------------------------------------------------------------------------
  // createChecklistInstance
  // -------------------------------------------------------------------------

  describe('createChecklistInstance', () => {
    it('creates the correct number of items', () => {
      const template = makeTemplate();
      const instance = createChecklistInstance(template, 'matter-1');
      expect(instance.items).toHaveLength(3);
    });

    it('items without dependencies start as NOT_STARTED', () => {
      const template = makeTemplate();
      const instance = createChecklistInstance(template, 'matter-1');
      const first = instance.items.find((i) => i.templateItemId === 'item-a');
      expect(first?.status).toBe('NOT_STARTED');
    });

    it('items with dependencies start as BLOCKED', () => {
      const template = makeTemplate();
      const instance = createChecklistInstance(template, 'matter-1');
      const second = instance.items.find((i) => i.templateItemId === 'item-b');
      expect(second?.status).toBe('BLOCKED');
    });

    it('all dependent items start as BLOCKED at creation', () => {
      const template = makeTemplate();
      const instance = createChecklistInstance(template, 'matter-1');
      const blocked = instance.items.filter((i) => i.status === 'BLOCKED');
      // item-b and item-c both have dependencies
      expect(blocked).toHaveLength(2);
    });

    it('preserves template item IDs as templateItemId', () => {
      const template = makeTemplate();
      const instance = createChecklistInstance(template, 'matter-1');
      const templateItemIds = instance.items.map((i) => i.templateItemId);
      expect(templateItemIds).toContain('item-a');
      expect(templateItemIds).toContain('item-b');
      expect(templateItemIds).toContain('item-c');
    });

    it('sets matterId on the instance', () => {
      const template = makeTemplate();
      const instance = createChecklistInstance(template, 'matter-42');
      expect(instance.matterId).toBe('matter-42');
    });

    it('sets templateId from the template', () => {
      const template = makeTemplate();
      const instance = createChecklistInstance(template, 'matter-1');
      expect(instance.templateId).toBe('tpl-1');
    });

    it('sorts items by order', () => {
      const template = makeTemplate({
        items: [
          { id: 'z', title: 'Last', order: 3, dependsOnItemIds: [], isAttorneyReview: false, isMandatory: true },
          { id: 'a', title: 'First', order: 1, dependsOnItemIds: [], isAttorneyReview: false, isMandatory: true },
          { id: 'm', title: 'Middle', order: 2, dependsOnItemIds: [], isAttorneyReview: false, isMandatory: true },
        ],
      });
      const instance = createChecklistInstance(template, 'matter-1');
      expect(instance.items[0].title).toBe('First');
      expect(instance.items[1].title).toBe('Middle');
      expect(instance.items[2].title).toBe('Last');
    });

    it('handles empty template items', () => {
      const template = makeTemplate({ items: [] });
      const instance = createChecklistInstance(template, 'matter-1');
      expect(instance.items).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // canCompleteItem
  // -------------------------------------------------------------------------

  describe('canCompleteItem', () => {
    it('returns true when no dependencies and user has role', () => {
      const item = makeItem();
      const result = canCompleteItem(item, [item], ['PARALEGAL']);
      expect(result.canComplete).toBe(true);
    });

    it('returns false when dependencies are not complete', () => {
      const depItem = makeItem({ templateItemId: 'item-a', status: 'NOT_STARTED' });
      const item = makeItem({
        id: 'inst-2',
        templateItemId: 'item-b',
        dependsOnItemIds: ['item-a'],
        status: 'BLOCKED',
      });
      const result = canCompleteItem(item, [depItem, item], ['PARALEGAL']);
      expect(result.canComplete).toBe(false);
      expect(result.reason).toContain('unmet dependency');
    });

    it('returns true when dependencies are COMPLETED', () => {
      const depItem = makeItem({ templateItemId: 'item-a', status: 'COMPLETED' });
      const item = makeItem({
        id: 'inst-2',
        templateItemId: 'item-b',
        dependsOnItemIds: ['item-a'],
        status: 'NOT_STARTED',
      });
      const result = canCompleteItem(item, [depItem, item], ['PARALEGAL']);
      expect(result.canComplete).toBe(true);
    });

    it('returns true when dependencies are WAIVED', () => {
      const depItem = makeItem({ templateItemId: 'item-a', status: 'WAIVED' });
      const item = makeItem({
        id: 'inst-2',
        templateItemId: 'item-b',
        dependsOnItemIds: ['item-a'],
        status: 'NOT_STARTED',
      });
      const result = canCompleteItem(item, [depItem, item], ['PARALEGAL']);
      expect(result.canComplete).toBe(true);
    });

    it('returns false when user lacks required role', () => {
      const item = makeItem({ requiredRole: 'ATTORNEY' });
      const result = canCompleteItem(item, [item], ['PARALEGAL']);
      expect(result.canComplete).toBe(false);
      expect(result.reason).toContain('ATTORNEY');
    });

    it('returns false for COMPLETED item (already terminal)', () => {
      const item = makeItem({ status: 'COMPLETED' });
      const result = canCompleteItem(item, [item], ['PARALEGAL']);
      expect(result.canComplete).toBe(false);
      expect(result.reason).toContain('terminal');
    });

    it('returns false for WAIVED item', () => {
      const item = makeItem({ status: 'WAIVED' });
      const result = canCompleteItem(item, [item], ['PARALEGAL']);
      expect(result.canComplete).toBe(false);
    });

    it('returns false for SKIPPED item', () => {
      const item = makeItem({ status: 'SKIPPED' });
      const result = canCompleteItem(item, [item], ['PARALEGAL']);
      expect(result.canComplete).toBe(false);
    });

    it('returns false when attorney review required but user is not attorney', () => {
      const item = makeItem({ isAttorneyReview: true });
      const result = canCompleteItem(item, [item], ['PARALEGAL']);
      expect(result.canComplete).toBe(false);
      expect(result.reason).toContain('attorney review');
    });

    it('returns true when attorney review required and user is attorney', () => {
      const item = makeItem({ isAttorneyReview: true });
      const result = canCompleteItem(item, [item], ['ATTORNEY']);
      expect(result.canComplete).toBe(true);
    });

    it('returns false when dependency item is missing from allItems', () => {
      const item = makeItem({
        dependsOnItemIds: ['item-nonexistent'],
        status: 'BLOCKED',
      });
      const result = canCompleteItem(item, [item], ['PARALEGAL']);
      expect(result.canComplete).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // computeChecklistProgress
  // -------------------------------------------------------------------------

  describe('computeChecklistProgress', () => {
    it('returns 0% when no items are complete', () => {
      const items = [
        makeItem({ status: 'NOT_STARTED' }),
        makeItem({ id: 'inst-2', status: 'BLOCKED' }),
      ];
      const progress = computeChecklistProgress(items);
      expect(progress.percent).toBe(0);
      expect(progress.completed).toBe(0);
      expect(progress.total).toBe(2);
    });

    it('returns 100% when all items are complete', () => {
      const items = [
        makeItem({ status: 'COMPLETED' }),
        makeItem({ id: 'inst-2', status: 'COMPLETED' }),
      ];
      const progress = computeChecklistProgress(items);
      expect(progress.percent).toBe(100);
      expect(progress.completed).toBe(2);
    });

    it('returns correct percent for partial completion', () => {
      const items = [
        makeItem({ status: 'COMPLETED' }),
        makeItem({ id: 'inst-2', status: 'NOT_STARTED' }),
        makeItem({ id: 'inst-3', status: 'BLOCKED' }),
        makeItem({ id: 'inst-4', status: 'NOT_STARTED' }),
      ];
      const progress = computeChecklistProgress(items);
      expect(progress.percent).toBe(25); // 1/4 = 25%
      expect(progress.completed).toBe(1);
      expect(progress.total).toBe(4);
    });

    it('counts WAIVED items as completed', () => {
      const items = [
        makeItem({ status: 'WAIVED' }),
        makeItem({ id: 'inst-2', status: 'NOT_STARTED' }),
      ];
      const progress = computeChecklistProgress(items);
      expect(progress.completed).toBe(1);
      expect(progress.percent).toBe(50);
    });

    it('counts SKIPPED items as completed', () => {
      const items = [
        makeItem({ status: 'SKIPPED' }),
        makeItem({ id: 'inst-2', status: 'NOT_STARTED' }),
      ];
      const progress = computeChecklistProgress(items);
      expect(progress.completed).toBe(1);
    });

    it('counts blocked items correctly', () => {
      const items = [
        makeItem({ status: 'COMPLETED' }),
        makeItem({ id: 'inst-2', status: 'BLOCKED' }),
        makeItem({ id: 'inst-3', status: 'BLOCKED' }),
      ];
      const progress = computeChecklistProgress(items);
      expect(progress.blocked).toBe(2);
    });

    it('returns 100% for empty items list', () => {
      const progress = computeChecklistProgress([]);
      expect(progress.percent).toBe(100);
      expect(progress.total).toBe(0);
    });

    it('rounds percent to nearest integer', () => {
      const items = [
        makeItem({ status: 'COMPLETED' }),
        makeItem({ id: 'inst-2', status: 'NOT_STARTED' }),
        makeItem({ id: 'inst-3', status: 'NOT_STARTED' }),
      ];
      const progress = computeChecklistProgress(items);
      expect(progress.percent).toBe(33); // 1/3 = 33.33 rounded to 33
    });
  });
});
