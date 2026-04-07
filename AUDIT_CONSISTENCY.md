# Consistency & Architecture Audit — Tools Management Section

**Auditor:** Consistency & Architecture Auditor (forge-audit team)
**Date:** 2026-04-01
**Scope:** `frontend/src/app/(dashboard)/tools/` and `frontend/src/lib/api/tools.ts`
**Reference sections:** `fleet/vehicles/`, `fleet/employees/`, `lib/api/vehicles.ts`

---

## Summary

| Severity | Count |
|----------|-------|
| HIGH     | 5     |
| MEDIUM   | 7     |
| LOW      | 4     |
| **Total** | **16** |

---

## Findings Table

| # | Severity | File | Line(s) | Description | Recommendation |
|---|----------|------|---------|-------------|----------------|
| 1 | HIGH | `lib/api/tools.ts` | 128, 184, 243, 359, 512, 570 | **PUT instead of PATCH for updates.** All `update()` methods in `tools.ts` use `apiClient.put(...)`. The established pattern (see `vehicles.ts:67`) is `apiClient.patch(...)` for partial updates. This is a REST semantics violation and will break if the backend enforces idempotency or requires full-document PUT bodies. | Change all `apiClient.put` calls in `update()` methods to `apiClient.patch`, matching `vehiclesService.update`. |
| 2 | HIGH | `lib/api/tools.ts` | entire file | **No default export.** `vehicles.ts` (line 91) exports `export default vehiclesService`. All other API files appear to follow this pattern. `tools.ts` exports only named exports (`toolsService`, `toolCasesService`, etc.) with no default export. This breaks import symmetry for any code that imports via default and causes an API surface inconsistency. | Add `export default toolsService` at the bottom (or a named barrel default if that is the convention for multi-service files — clarify and document). |
| 3 | HIGH | `lib/api/tools.ts` | 117–118, 173–174 | **`toSnakeCase` receives wrong type cast.** Vehicles pattern: `toSnakeCase(data) as unknown as VehicleCreateRequest`. Tools pattern: `toSnakeCase(data as Record<string, unknown>)` — the cast is applied to the input instead of the output. This bypasses TypeScript's output type checking; the return type of the function call becomes `Record<string, unknown>` instead of the API request type. No typed request DTOs (`ToolCreateRequest`, `ToolCaseCreateRequest`, etc.) exist. | Define typed request interfaces (`ToolCreateRequest`, etc.) in `lib/api/types.ts` and cast the output of `toSnakeCase` to those types, matching the vehicles pattern. |
| 4 | HIGH | `tools/categories/page.tsx`, `tools/locations/page.tsx` | entire files | **Missing `error.tsx` and `loading.tsx` in categories/ and locations/ subdirectories.** Every other subsection (`inventory/`, `cases/`, `consumables/`, `assignments/`) has both `error.tsx` and `loading.tsx`. `categories/` and `locations/` have only `page.tsx`. Without these files, Next.js cannot show route-level loading skeletons or catch errors at the segment level. | Add `error.tsx` and `loading.tsx` to `tools/categories/` and `tools/locations/`, matching the pattern in `tools/inventory/`. |
| 5 | HIGH | `tools/inventory/page.tsx` | 309 | **Dead dependency in `columns` `useMemo`.** `getToolAssignment` and `resolveAssignee` are declared at lines 141 and 145, included in the `columns` memo dependency array (line 309), but are **never called inside the `columns` definition**. The columns do not render assignee info. This means the memo re-runs unnecessarily on every assignment data change, and the callbacks are dead code in this context. | Either wire `getToolAssignment`/`resolveAssignee` into the column cells (e.g., an "Assigned To" column), or remove them from the `columns` memo deps if that column is intentionally absent. |
| 6 | MEDIUM | `tools/page.tsx` | 35–91, 156, 171, 186, 201 | **Hardcoded `dark:` Tailwind variants throughout the dashboard page.** The project's `CLAUDE.md` explicitly prohibits using dark-first color tokens (`dark:bg-*`) by default. No other fleet section dashboard page (`fleet/page.tsx`) was found using these. Light mode is the required default. | Remove all `dark:` variant classes from `tools/page.tsx` to comply with the global UI mode rule. |
| 7 | MEDIUM | `tools/page.tsx` | 239 | **Hardcoded i18n fallback key mismatch.** The module navigation card uses `t('hub.openModule', 'Open module')` — a `hub.*` namespace key — inside the `tools/` section. All other tools strings use `tools.*` namespace keys. This is a namespace boundary violation that will break if translations are split per-module. | Change to `t('tools.dashboard.openModule', 'Open module')` to stay within the `tools.*` namespace. |
| 8 | MEDIUM | `tools/cases/page.tsx` | 46–53, 55–61 | **Local status/condition config duplicates the one in `tools/inventory/page.tsx`.** `toolStatusConfig` in `inventory/page.tsx` (lines 49–56) and `statusConfig` in `cases/page.tsx` (lines 46–53) are nearly identical objects (same keys, same badge variants, same label keys). `conditionConfig` is also duplicated. This violates DRY and means status color/label changes must be made in multiple places. | Extract shared status/condition config objects into a `tools/shared.ts` or `lib/constants/tools.ts` file and import from both pages. |
| 9 | MEDIUM | `tools/cases/page.tsx` | 47 | **i18n key namespace inconsistency in status config.** `cases/page.tsx` uses `tools.cases.status.available` while `inventory/page.tsx` uses `tools.status.available` for the same concept. They render the same UI element (status badge) but with different translation key namespaces, which means the translation file must duplicate entries. | Standardize on `tools.status.*` for ToolStatus labels across all pages, since it is an entity-level concept not specific to the cases page. |
| 10 | MEDIUM | `lib/api/tools.ts` (consumablesService) | 529–585 | **`consumablesService` methods lack JSDoc comments**, unlike every other service block in the same file (`toolCategoriesService`, `toolLocationsService`, `toolCasesService`, etc. all have `/** */` doc comments on every method). This inconsistency will confuse IDE hover hints. | Add JSDoc comments to all `consumablesService` methods consistent with the rest of `tools.ts`. |
| 11 | MEDIUM | `tools/inventory/page.tsx` | 84 | **Hardcoded `limit: 2000` magic number** passed to `toolsService.getAll({ limit: 2000 })`. The same pattern appears in `tools/categories/page.tsx:63` and `tools/locations/page.tsx:67`. No other section (vehicles, fleet) uses a hardcoded limit in the list call. This bypasses pagination and will cause performance issues at scale. | Define a shared constant (e.g., `MAX_LIST_LIMIT = 2000`) or implement server-side pagination with the `useApi` hook, matching how vehicles handles this without a hard cap. |
| 12 | MEDIUM | `tools/inventory/page.tsx` | 96 | **`employees` data typed as `Driver[]`** (`const { data: employees } = useApi<Driver[]>(...)`). The variable is named `employees` but typed as `Driver`. This is a semantic mismatch: drivers and employees are different domain concepts in this codebase. `cases/page.tsx` has the same issue (line 82). | Either use the correct `Employee` type if it exists, or rename the variable to `drivers` to match the type. This is a domain modeling error that will cause confusion when an `employeesService` is added. |
| 13 | LOW | `tools/error.tsx`, `tools/inventory/error.tsx`, `tools/cases/error.tsx`, `tools/consumables/error.tsx`, `tools/assignments/error.tsx` | all | **Hardcoded English strings in `error.tsx` files** ("Something went wrong", "Try again"). These bypass the i18n system used everywhere else. The `vehicles` section has the same issue but the tools section should not perpetuate it. | Use `t('common.error.title')` and `t('common.tryAgain')` consistent with how other components handle error copy. |
| 14 | LOW | `tools/locations/page.tsx` | 172 | **Wrong column `id` for address column.** The column `id` is `'description'` (line 172) but the column renders `loc.address` and its header is `t('tools.fields.address', 'Address')`. This is a copy-paste error and will produce incorrect column persistence (DataTable stores column widths/sort by `id`). | Change column `id` to `'address'` to match the data it represents. |
| 15 | LOW | `tools/locations/page.tsx` | 208 | **`locationStats` in `columns` memo dependency is unused.** `locationStats` (computed at line 71) is listed as a dependency of `columns` useMemo (line 208) but is never read inside the `columns` definition — the column cells don't render any stats from it. | Remove `locationStats` from the `columns` memo dependency array (or add a stats column if the feature was intended). |
| 16 | LOW | `tools/cases/page.tsx` | 264 | **`employees` and `vehicles` data fetched but not used in columns.** `employees` (line 82) and `vehicles` (line 87) are fetched for resolving assignee names but no column in the `cases` DataTable renders this data. The `columns` memo at line 264 also does not reference them. This is dead fetch overhead on every page load. | Remove the unused `useApi` calls for `employees` and `vehicles` from `cases/page.tsx`, or add an "Assigned To" column if that display was intended. |

---

## Critical Findings Detail

### Finding #1 — PUT vs PATCH (HIGH)

`vehicles.ts:67` clearly establishes the project standard:
```ts
// vehicles.ts — established pattern
const response = await apiClient.patch<VehicleApiResponse>(`/vehicles/${id}`, request);
```

`tools.ts` deviates on every single update method:
```ts
// tools.ts — deviates
const response = await apiClient.put<ToolCategoryResponse>(`/tool-categories/${id}`, request);
```
6 occurrences total (lines 128, 184, 243, 359, 512, 570).

### Finding #3 — `toSnakeCase` type cast location (HIGH)

```ts
// vehicles.ts — correct: cast on output
const request = toSnakeCase(data) as unknown as VehicleCreateRequest;

// tools.ts — wrong: cast on input, loses output typing
const request = toSnakeCase(data as Record<string, unknown>);
```
`tools.ts` also lacks typed request DTOs (`ToolCreateRequest`, etc.), while `vehicles.ts` imports `VehicleCreateRequest` and `VehicleUpdateRequest` from `types.ts`.

### Finding #5 — Dead `getToolAssignment`/`resolveAssignee` in `columns` deps (HIGH)

```ts
// inventory/page.tsx:309
], [t, getCategoryName, getToolAssignment, resolveAssignee, handleDeleteClick]);
//                       ^^^^^^^^^^^^^^^^   ^^^^^^^^^^^^^^^  ← listed but never called inside columns
```
Both callbacks are defined and depend on `employees` and `vehicles` API calls (4 extra network requests per page load), yet produce no visible output in the table.

---

## File Structure Comparison

| Path | inventory | cases | consumables | assignments | categories | locations |
|------|-----------|-------|-------------|-------------|------------|-----------|
| `page.tsx` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `loading.tsx` | ✅ | ✅ | ✅ | ✅ | ❌ MISSING | ❌ MISSING |
| `error.tsx` | ✅ | ✅ | ✅ | ✅ | ❌ MISSING | ❌ MISSING |
| `new/page.tsx` | ✅ | ✅ | ✅ | — | — | — |
| `[id]/page.tsx` | ✅ | ✅ | ✅ | — | — | — |
| `[id]/edit/page.tsx` | ✅ | ✅ | ✅ | — | — | — |
