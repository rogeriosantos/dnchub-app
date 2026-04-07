# Dead Code Audit — Tools Management Section

**Scope:** `frontend/src/app/(dashboard)/tools/` + `frontend/src/lib/api/tools.ts`
**Date:** 2026-04-01
**Auditor:** dead-code-hunter agent

---

## Findings

| # | Severity | File | Line(s) | Description | Recommendation |
|---|----------|------|---------|-------------|----------------|
| 1 | HIGH | `frontend/src/app/(dashboard)/tools/inventory/page.tsx` | 91–105, 130–139, 141–157 | `activeAssignments`, `employees`, `vehicles`, `toolAssignmentMap`, `getToolAssignment`, and `resolveAssignee` are all fetched/computed solely to support an assignee column that was removed. They appear in the `columns` dep array (line 309) but are never called inside any column `cell` renderer. Three extra API calls (`toolAssignmentsService.getActive()`, `driversService.getAll()`, `vehiclesService.getAll()`) fire on every page load producing no visible output. | Remove all six references and the three `useApi` hooks. Remove from `columns` dep array. |
| 2 | HIGH | `frontend/src/lib/api/tools.ts` | 310–313 | `toolsService.getByErpCode()` is exported but never imported or called anywhere in the frontend codebase. | Remove the method or mark internal-only with a comment if reserved for future use. |
| 3 | HIGH | `frontend/src/lib/api/tools.ts` | 318–323 | `toolsService.getByCategory()` is exported but never called anywhere. Functionality is covered inline by passing `category_id` to `getAll()`. | Remove the method. |
| 4 | HIGH | `frontend/src/lib/api/tools.ts` | 443–449 | `toolAssignmentsService.getByEmployee()` is exported but never called anywhere in the frontend. | Remove the method. |
| 5 | HIGH | `frontend/src/lib/api/tools.ts` | 453–459 | `toolAssignmentsService.getByVehicle()` is exported but never called anywhere in the frontend. | Remove the method. |
| 6 | HIGH | `frontend/src/lib/api/tools.ts` | 555–560 | `consumablesService.getLowStock()` is exported but never called anywhere. Consumers use `getAll({ low_stock_only: true })` inline instead. | Remove the method. |
| 7 | MEDIUM | `frontend/src/lib/api/index.ts` | 91–96 | All five list-param types (`ToolListParams`, `ToolCaseListParams`, `ToolAssignmentListParams`, `ToolCalibrationListParams`, `ConsumableListParams`) are re-exported from `index.ts` but never imported in any page or component — only used internally within `tools.ts`. | Remove from `index.ts` re-exports (keep in `tools.ts` for internal typing). |
| 8 | MEDIUM | `frontend/src/app/(dashboard)/tools/locations/page.tsx` | 71–83, 208 | `locationStats` (a `Map` of tool counts per location) is computed via `useMemo` and listed in the `columns` dep array, but is never accessed inside any column `cell` or `sortValue`. The `allTools` fetch (`toolsService.getAll({ limit: 2000 })`) at line 66 fires solely to feed this dead computation. | Remove `locationStats`, the `allTools` `useApi` call, and the dep from the `columns` array. |
| 9 | MEDIUM | `frontend/src/app/(dashboard)/tools/page.tsx` | 17, 20 | `AlertCircle` and `Clock` are imported from `lucide-react` but never referenced in the component's JSX or logic. | Remove both from the import statement. |
| 10 | LOW | `frontend/src/lib/api/tools.ts` | 328–333 | `toolsService.getUnassigned()` is exported, but all call sites use `toolsService.getAll()` with `params` filtering instead. The one apparent use (`cases/[id]/edit/page.tsx:80`) calls it, so this method IS used — see note. | Keep; was confirmed used at `cases/[id]/edit/page.tsx:80`. *(Not a finding — retained for accuracy.)* |

---

## Summary

**Total findings: 9**

### Severity breakdown
- HIGH: 6 (unexported but dead service methods + a multi-hook dead code block causing 3 spurious API calls per page load)
- MEDIUM: 3 (unused re-exports, dead computed value + spurious API call, unused icon imports)
- LOW: 0 confirmed

### Impact
- Finding #1 (inventory page) is the most impactful at runtime: three unnecessary network requests fire on every `/tools/inventory` page load (`getActive`, `driversService.getAll`, `vehiclesService.getAll`) with the results going nowhere.
- Findings #2–6 inflate the API surface with methods that have no callers, creating maintenance burden and misleading future developers.
- Finding #8 fires one additional `getAll` call for all tools on every `/tools/locations` page load for a stat table column that was never wired up.

---

## Files Audited

| File | Notes |
|------|-------|
| `frontend/src/lib/api/tools.ts` | 5 dead service methods found |
| `frontend/src/lib/api/index.ts` | 5 dead list-param re-exports |
| `frontend/src/app/(dashboard)/tools/page.tsx` | 2 unused icon imports |
| `frontend/src/app/(dashboard)/tools/inventory/page.tsx` | Large dead block: 3 hooks + 2 callbacks never used in columns |
| `frontend/src/app/(dashboard)/tools/cases/page.tsx` | Clean |
| `frontend/src/app/(dashboard)/tools/assignments/page.tsx` | Clean |
| `frontend/src/app/(dashboard)/tools/consumables/page.tsx` | Clean |
| `frontend/src/app/(dashboard)/tools/categories/page.tsx` | Clean |
| `frontend/src/app/(dashboard)/tools/locations/page.tsx` | Dead `locationStats` computation + spurious API call |
| `frontend/src/app/(dashboard)/tools/inventory/[id]/page.tsx` | Clean |
| `frontend/src/app/(dashboard)/tools/inventory/[id]/edit/page.tsx` | Clean |
| `frontend/src/app/(dashboard)/tools/cases/[id]/page.tsx` | Clean |
| `frontend/src/app/(dashboard)/tools/cases/[id]/edit/page.tsx` | Clean |
| `frontend/src/app/(dashboard)/tools/inventory/new/page.tsx` | Clean |
| `frontend/src/app/(dashboard)/tools/cases/new/page.tsx` | Clean |
| `frontend/src/app/(dashboard)/tools/consumables/new/page.tsx` | Clean |
| `frontend/src/app/(dashboard)/tools/consumables/[id]/page.tsx` | Clean |
| `frontend/src/app/(dashboard)/tools/consumables/[id]/edit/page.tsx` | Clean |
