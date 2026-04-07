# Missing Implementation Audit — Tools Management

**Auditor:** Missing Implementation Auditor (forge-audit team)
**Date:** 2026-04-01
**Scope:** `frontend/src/app/(dashboard)/tools/` + `frontend/src/lib/api/tools.ts` + `en.json`

---

## Findings Table

| # | Severity | File | Line(s) | Description | Recommendation |
|---|----------|------|---------|-------------|----------------|
| 1 | CRITICAL | `tools/assignments/page.tsx` | — | No detail page exists for individual assignments (`/tools/assignments/[id]`). The list page links rows via the item name to `/tools/inventory/[id]` but there is no way to view or edit a single assignment record in isolation. The `toolAssignmentsService.getById()` and `toolAssignmentsService.delete()` exist in the API but are never called from the UI. | Create `tools/assignments/[id]/page.tsx` showing assignment details and exposing delete. |
| 2 | CRITICAL | `tools/inventory/[id]/page.tsx` | 540–584 | Calibration tab has NO "Add Calibration" action. The tab displays calibration history but there is no button or form to create a new calibration record. `toolCalibrationsService.create()` exists in the API but is unreachable from the UI. | Add a "Log Calibration" button on the calibrations tab linking to a create form or opening an inline dialog. |
| 3 | CRITICAL | `tools/assignments/page.tsx` | 443–446 | On assign-form submission failure the error string falls back to a hardcoded English literal `'Failed to create assignment'` with no i18n wrapping and no user-visible error surfacing beyond the inline `assignError` state — but if the dialog is closed (e.g., backdrop click) the error is silently lost. | Wrap fallback string in `t()` and ensure the error persists or is toasted after dialog close. |
| 4 | HIGH | `tools/` (all sub-sections) | — | The dashboard hub links to six modules. One of those modules — **Calibrations** — has a full API service (`toolCalibrationsService`) and data is shown read-only in the inventory detail page, but there is **no dedicated calibrations section/page** at all (no `tools/calibrations/` route). The dashboard does not expose calibrations as a top-level module. | Create `tools/calibrations/page.tsx` (list), `new/page.tsx`, and `[id]/page.tsx` to give calibrations a management surface. |
| 5 | HIGH | `tools/inventory/page.tsx` | 309 | Columns `memo` references `getToolAssignment` and `resolveAssignee` in the `useMemo` deps array but neither is used in any column `cell` render — the "Assigned To" information computed by those functions is **never displayed** in the table. The inventory list has no assignee column despite the heavy data fetching for it. | Either remove the unused data fetches (employees, vehicles, activeAssignments from inventory page) or add an assignee column to the table. |
| 6 | HIGH | `tools/assignments/page.tsx` | 162, 177–179, 220–222 | Multiple hardcoded English strings inside `toolOptions` / `caseOptions` builders: `"In case: ..."`, `"Unavailable — ..."`, `"Unknown"`. These are displayed in the assignment dialog's SearchableSelect and are never passed through `t()`. | Wrap all status description strings in `t()` calls with appropriate keys. |
| 7 | HIGH | `tools/consumables/[id]/page.tsx` | 49–53 | The `statusConfig` object uses hardcoded English `label` strings (`'In Stock'`, `'Low Stock'`, `'Out of Stock'`, `'Ordered'`, `'Retired'`). The code does use `t(\`tools.consumables.status.${consumable.status}\`, cfg.label)` as the fallback, so in production without the i18n key the hardcoded string shows, but the page does not consistently use `t()` as the primary source like all other pages do. | Change all `label` entries to use `t()` as the primary call; remove the raw string fallbacks or convert to key-only form. |
| 8 | HIGH | `tools/categories/page.tsx` | 194 | Hardcoded English string `"avail."` in the category stats cell: `({stats.available} avail.)`. Not wrapped in `t()`. | Replace with `t('tools.categories.statAvailable', 'avail.')` or a full label key. |
| 9 | HIGH | `tools/assignments/page.tsx` | 270, 274, 822, 825 | Hardcoded fallback strings `'Unknown tool'` and `'Unknown case'` in `getItemName()` and the return-checklist label builder. Not wrapped in `t()`. | Replace with `t('tools.assignments.unknownTool', 'Unknown tool')` etc. |
| 10 | MEDIUM | `tools/inventory/page.tsx` | 186–196 | Delete mutation error is caught with `console.error` only. If `deleteMutation.mutate()` throws, the dialog stays open showing no user-facing error. The `AlertDialogAction` has no disabled state during the delete operation (only the loading label changes). | Surface the error in an Alert or toast; disable the action button while deleting. |
| 11 | MEDIUM | `tools/cases/page.tsx` | 143–153 | Same issue as #10: delete failure silently logs to console only (`console.error('Failed to delete case:', error)`). No error is shown to the user. | Surface delete errors to the user via Alert or toast. |
| 12 | MEDIUM | `tools/categories/page.tsx` | 136–139 | `handleSave` catches errors with `console.error` only. A failed create or update shows no error feedback to the user; the dialog simply stays open. | Add an error state in the dialog and display it to the user on failure. |
| 13 | MEDIUM | `tools/locations/page.tsx` | 131–137 | Same silent-error issue: `handleSave` and `handleDeleteConfirm` both only `console.error`. No user-visible error feedback on mutation failure. | Add an error state and display it in the dialog. |
| 14 | MEDIUM | `tools/inventory/[id]/page.tsx` | 119–127 | `handleDelete` catches failures silently (resets `isDeleting` but shows no error to the user). The delete dialog closes and the user is left wondering what happened. | Display an error alert if delete fails. |
| 15 | MEDIUM | `tools/cases/[id]/page.tsx` | 101–109 | Same silent delete failure as #14. | Same fix. |
| 16 | MEDIUM | `tools/consumables/[id]/page.tsx` | 95–103 | Same silent delete failure as #14. | Same fix. |
| 17 | MEDIUM | `tools/inventory/new/page.tsx` | 93 | Error catch falls back to `'Failed to create tool.'` — a hardcoded non-i18n English string. | Wrap with `t('tools.inventory.failedToCreate', 'Failed to create tool.')`. |
| 18 | MEDIUM | `tools/cases/new/page.tsx` | 63 | Error catch falls back to `'Failed to create case.'` — hardcoded English literal. | Wrap with `t('tools.cases.failedToCreate', 'Failed to create case.')`. |
| 19 | MEDIUM | `tools/cases/[id]/edit/page.tsx` | 127–128, 163, 168 | Multiple `handleAdd*` / `handleRemove*` error handlers fall back to hardcoded English strings (`'Failed to add tool to case.'`, `'Failed to remove tool from case.'`, etc.). None are i18n-wrapped. | Add i18n keys for all these error strings. |
| 20 | MEDIUM | `tools/inventory/[id]/edit/page.tsx` | 125, 161 | `handleConvertToCase` and `handleSubmit` error messages fall back to hardcoded English strings without `t()`. | Wrap with appropriate i18n keys. |
| 21 | MEDIUM | `tools/cases/[id]/edit/page.tsx` | 179–182 | `handleConvertToTool` error falls back to hardcoded `'Failed to convert case to tool.'`. | Wrap with i18n key. |
| 22 | MEDIUM | `tools/consumables/[id]/page.tsx` | 116 | `adjustError` falls back to hardcoded `'Failed to adjust quantity.'`. | Wrap with `t()`. |
| 23 | LOW | `en.json` | — | **12 i18n keys referenced in code but not defined in `en.json`:** `tools.actions.convertToCase`, `tools.actions.convertToCaseDesc`, `tools.actions.convertToCaseTitle`, `tools.actions.convertToTool`, `tools.actions.convertToToolConfirm`, `tools.categories.statTotal`, `tools.categories.topLevel`, `tools.consumables.delta`, `tools.consumables.failedToLoad`, `tools.consumables.fields.quantity`, `tools.consumables.items`, `tools.fields.tools`. These fall back to the English default strings in the `t()` call so the app does not break, but the keys are missing from the locale file. | Add all 12 missing keys to `en.json` (and any other locale files). |
| 24 | LOW | `tools/assignments/page.tsx` | 162 | `statusLine` for "in case" uses a template literal `"In case: ..."` with a colon separator — the word "In case" is hardcoded English and appears in the SearchableSelect UI. | Replace with a translated label. |
| 25 | LOW | `tools/inventory/page.tsx` | 159 | Status label options in the inventory status-stats mini-bar use `t(config.labelKey)` correctly, but the `toolStatusConfig` for `assigned` uses `badge: 'destructive'` which renders red — typically reserved for errors, not for the normal "assigned" state. This is a UX inconsistency (it's a feature not a bug, but misleads users). | Consider changing `assigned` badge to `default` or a custom blue class like the cases page does. |

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 3 |
| HIGH | 7 |
| MEDIUM | 13 |
| LOW | 3 |
| **Total** | **26** |

---

## Top Issues by Impact

1. **No Assignment detail page** (CRITICAL #1) — `toolAssignmentsService.getById()` and `delete()` are dead API surface; there is no page to view or manage an individual assignment record.
2. **No way to add calibration records** (CRITICAL #2) — The calibration API service is fully implemented but has zero entry points in the UI. Users can read calibration history but can never log a new one.
3. **12 missing i18n keys** (LOW #23) — All referenced keys fall back to inline English strings, masking the gap and making the app non-translatable for those strings.
