# Test Run Output

**Date**: 2026-04-21
**Runner**: vitest 2.1.9
**Config**: vitest.config.ts (module aliases for @ttaylor/*, single-fork pool)
**Command**: `npx vitest run --config vitest.config.ts`

---

## Results

```
 RUN  v2.1.9 /home/aiciv/projects/ttaylor

 OK  tests/unit/workflows/checklist-engine.test.ts (28 tests) 6ms
 OK  tests/unit/workflows/matter-state-machine.test.ts (41 tests) 4ms
 OK  tests/unit/workflows/deadline-calculator.test.ts (25 tests) 4ms
 OK  tests/unit/documents/document-lifecycle.test.ts (34 tests) 2ms
 OK  tests/unit/documents/template-engine.test.ts (25 tests) 10ms

 Test Files  5 passed (5)
      Tests  153 passed (153)
   Start at  18:06:43
   Duration  228ms (transform 67ms, setup 0ms, collect 94ms, tests 26ms, environment 0ms, prepare 32ms)
```

## Summary

| Suite | Tests | Duration | Status |
|-------|-------|----------|--------|
| checklist-engine.test.ts | 28 | 6ms | PASS |
| matter-state-machine.test.ts | 41 | 4ms | PASS |
| deadline-calculator.test.ts | 25 | 4ms | PASS |
| document-lifecycle.test.ts | 34 | 2ms | PASS |
| template-engine.test.ts | 25 | 10ms | PASS |
| **Total** | **153** | **26ms** | **ALL PASS** |

## Test Coverage by Module

### @ttaylor/workflows
- **matter-state-machine**: 41 tests covering valid transitions (19), invalid transitions (7), attorney-required transitions (5), terminal states (3), getAvailableTransitions (7)
- **checklist-engine**: 28 tests covering instance creation, dependency checks, role validation, progress computation
- **deadline-calculator**: 25 tests covering Texas Family Code deadline rules, business day calculations, answer deadline Monday rule

### @ttaylor/documents
- **document-lifecycle**: 34 tests covering all 10 state transitions, attorney-only transitions, isDocumentFileable checks
- **template-engine**: 25 tests covering Handlebars rendering, merge field validation, standard merge fields, block helper handling

## Infrastructure Notes

- Tests use vitest (not jest) -- the `test:unit` script has been updated accordingly
- Module aliases configured in vitest.config.ts resolve `@ttaylor/*` to `packages/*/src`
- jest.config.js also created for integration test compatibility
- handlebars added to devDependencies for template-engine tests
- Pool set to single-fork to work within container resource limits
