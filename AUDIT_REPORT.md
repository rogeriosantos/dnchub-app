# Application Audit Report

- **Date:** 2026-04-01
- **Project:** dnchub — Tools Management (Frontend)
- **Root:** `D:/_PROJECTS/APPFACTORY/dnchub`
- **Stack:** Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui
- **Auditors:** 6-agent team (Dead Code · Missing Impl · Data Integrity · Security · Consistency · SaaS Pages)
- **Raw findings:** 93 across all auditors
- **After deduplication:** 70 unique findings

| Severity  | Count |
|-----------|-------|
| CRITICAL  | 10    |
| HIGH      | 24    |
| MEDIUM    | 24    |
| LOW       | 12    |
| **Total** | **70** |

---

## Executive Summary

The tools management frontend section is **functionally complete for its core inventory/cases/consumables flows** but has significant gaps in security enforcement, data integrity, and feature completeness. The most urgent risks are: (1) the dashboard layout has **no server-side or synchronous auth guard** — all protected pages flash to unauthenticated users before the client-side redirect fires; (2) **role-based access control is purely cosmetic** — any authenticated user can create, edit, and delete tools regardless of their `viewer`/`operator` role; (3) a **race condition in the token refresh logic** can log out users with valid sessions when two concurrent requests hit a 401. Beyond security, the assignments sub-section is the weakest link — there is no detail or edit page for individual assignment records, and `toolCalibrationsService` has a full API implementation with zero UI entry points for creating records. Approximately **4 unnecessary API requests fire on every inventory page load** due to dead code that was never wired up to the UI.

---

## Critical & High Findings (Action Required)

### CRITICAL

| # | Category | File | Line(s) | Description | Recommendation |
|---|----------|------|---------|-------------|----------------|
| C1 | Security | `app/(dashboard)/layout.tsx` | 1–9 | **No auth guard in dashboard layout.** Layout renders `<AppShell>` with zero authentication check. Auth is delegated to a `useEffect` in `AuthContext`, which fires only after the page renders. All protected content is visible/interactive during the loading window. | Add a synchronous auth gate in the layout (render `null` until auth resolves) or use Next.js Middleware for server-side route protection. |
| C2 | Security | `contexts/auth-context.tsx` | 30–76 | **TOCTOU race in auth flow.** `isAuthenticated` is `false` before `checkAuth()` resolves. `isLoading` is set to `true` only inside the effect, creating a brief window where a valid session can be redirected to `/login`. `isPublicRoute` defaults to `true` when `pathname` is `null`, skipping auth entirely until the router resolves. | Initialize `isLoading: true` at mount (not inside the effect). Use Next.js Middleware for server-side guard. |
| C3 | Data Integrity | `lib/api/client.ts` | 131–150 | **Race condition in concurrent 401 / token refresh.** If two requests fail with 401 simultaneously, the second caller enters when `isRefreshing = true` but `refreshPromise` may still be `null`, causing it to `await null`, clear tokens, and redirect to `/login` — even though a valid refresh was in flight. | Assign `refreshPromise` before setting `isRefreshing = true`. Null-check `refreshPromise` before awaiting. |
| C4 | Data Integrity | `transformers.ts` | 601–622 | **Unsafe enum cast for `conditionAtCheckout`/`conditionAtReturn`.** Fields are cast directly from `string` to `ToolCondition` enum without validation. An unexpected API string value produces an invalid enum; downstream use as an index into `toolConditionConfig` (inventory detail, line 516) throws a runtime `Cannot read properties of undefined`. | Validate the string against allowed `ToolCondition` values before casting; return `null` on unknown values. |
| C5 | Data Integrity | `transformers.ts` | 680–695 | **`toSnakeCase` does not recurse into nested objects/arrays.** All create/update calls pass form data through `toSnakeCase`. Any nested field (e.g., `images: string[]`) has its keys left in camelCase, silently rejected or dropped by the backend — data loss on creation/update. | Add recursive handling for objects and arrays in `toSnakeCase`. |
| C6 | Data Integrity | `tools/inventory/[id]/page.tsx` | 86–91 | **Assignment history tab shows only active assignments.** `toolAssignmentsService.getActive()` is called but the "Assignment History" tab renders `assignments` implying all records. Historical (returned) assignments are silently absent; the count badge is wrong. | Call `toolAssignmentsService.getAll({ tool_id: toolId })` for the history tab; derive the active assignment from the returned list. |
| C7 | Data Integrity | `tools/assignments/page.tsx` | 392–450 | **Assignment form submits with unvalidated `department`/`section` fields.** Empty string `""` is accepted for department/section assignment types, silently storing corrupt records in the backend. | Add `.trim().length > 0` validation for `department` and `section` fields before API call. |
| C8 | Missing Impl | `tools/assignments/` | — | **No detail or edit page for assignments.** `toolAssignmentsService.getById()` and `delete()` exist but are unreachable from the UI. No way to view or manage an individual assignment record in isolation. *(Also flagged by SaaS Pages auditor.)* | Create `tools/assignments/[id]/page.tsx` (detail) and `tools/assignments/[id]/edit/page.tsx`. |
| C9 | Missing Impl | `tools/inventory/[id]/page.tsx` | 540–584 | **No "Add Calibration" action despite full API service.** Calibration tab displays history read-only. `toolCalibrationsService.create()` exists but is unreachable from the UI; users can never log a new calibration. | Add a "Log Calibration" button on the calibrations tab (link or inline dialog). |
| C10 | Missing Impl | `tools/assignments/page.tsx` | 443–446 | **Assignment error silently lost on dialog close.** Submission failure falls back to hardcoded `'Failed to create assignment'` (not i18n-wrapped); if the dialog is closed by backdrop click, the error is discarded with no user feedback. | Wrap fallback in `t()`; persist error via toast after dialog close. |

---

### HIGH

| # | Category | File | Line(s) | Description | Recommendation |
|---|----------|------|---------|-------------|----------------|
| H1 | Dead Code | `tools/inventory/page.tsx` | 91–105, 130–139, 309 | **3 spurious API calls fire on every page load** for dead assignee data. `activeAssignments`, `employees`, `vehicles` are fetched and `getToolAssignment`/`resolveAssignee` computed, but no column renders this data. Also flagged by Consistency (#5) and Missing Impl (#5) auditors. | Remove the three `useApi` hooks and both callbacks, or add an "Assigned To" column to make the fetches useful. |
| H2 | Dead Code | `lib/api/tools.ts` | 310–323 | `toolsService.getByErpCode()` and `toolsService.getByCategory()` are exported but never called anywhere. `getByCategory` is covered by passing `category_id` to `getAll()`. | Remove both methods. |
| H3 | Dead Code | `lib/api/tools.ts` | 443–459 | `toolAssignmentsService.getByEmployee()` and `getByVehicle()` are exported but never called. | Remove both methods. |
| H4 | Dead Code | `lib/api/tools.ts` | 555–560 | `consumablesService.getLowStock()` exported but never called; consumers use `getAll({ low_stock_only: true })` inline. | Remove the method. |
| H5 | Missing Impl | `tools/` (all) | — | **No calibrations management section.** `toolCalibrationsService` is fully implemented; calibration data is visible read-only in inventory detail. No dedicated `tools/calibrations/` route or management surface exists. | Create `tools/calibrations/page.tsx` (list), `new/page.tsx`, and `[id]/page.tsx`. |
| H6 | Missing Impl | `tools/assignments/page.tsx` | 162, 177–179, 220–222 | **Hardcoded English strings in assignment dialog** (`"In case: ..."`, `"Unavailable — ..."`, `"Unknown"`) passed into `SearchableSelect`. Not i18n-wrapped. | Wrap all status description strings in `t()` with appropriate keys. |
| H7 | Missing Impl | `tools/categories/page.tsx` | 194 | Hardcoded `"avail."` in category stats cell, not wrapped in `t()`. | Replace with `t('tools.categories.statAvailable', 'avail.')`. |
| H8 | Missing Impl | Multiple | various | **Silent error handling across 6 mutation handlers** (inventory delete, cases delete, categories/locations handleSave, cases/[id] delete, consumables/[id] delete). Failures only `console.error`; users see no feedback. | Surface errors via `setError` state or toast in all six locations. |
| H9 | Data Integrity | `types/index.ts` + `transformers.ts` | 559–579 / 569–594 | **`Tool.organizationId` and `ToolCase.organizationId` missing from domain types.** `ToolResponse.organization_id` is required but silently dropped in both transformers. Field is unavailable to any component without a re-fetch. | Add `organizationId: string` to both domain interfaces and map in transformers. |
| H10 | Data Integrity | `tools/consumables/page.tsx` | 109–127 | **`handleAdjustConfirm` and `handleDeleteConfirm` silently swallow errors** (empty catch blocks). Dialog stays open in a non-loading state with no error message. | Surface errors via state or toast. |
| H11 | Data Integrity | `tools/inventory/page.tsx` | 107–127 | **Status override logic gap.** `effectiveTools` only overrides status to `'assigned'` when `tool.status === 'available'`. A tool with status `'in_repair'` that has an active assignment still shows `in_repair`; the "Assigned" stats card under-counts. | Remove the `tool.status === 'available'` guard. |
| H12 | Data Integrity | `tools/assignments/page.tsx` | 354–373 | **`handleReturnConfirm` discards per-tool condition checklist for case tools.** `returnChecklist` conditions are collected but only the case-level `condition_at_return` is sent to the API. Individual tool conditions are silently discarded. | Call per-tool return endpoint for each checked item, or document the limitation clearly. |
| H13 | Data Integrity | `tools/categories/page.tsx` | 121–139 | **Category save allows cyclic parent references.** Filters only remove the immediate editing category from the parent dropdown; a user can create A → B → A cycles that will cause infinite recursion in any tree rendering. | Collect and exclude all descendants of the editing category from the parent dropdown. |
| H14 | Data Integrity | `tools/assignments/page.tsx` | 128–130 | **`assignMutation` cast bypasses type safety; `assigned_by_id` never set.** Mutation param is `Record<string, unknown>` cast to `Partial<ToolAssignment>`. The required `assigned_by_id` field is never included, causing a 422 backend rejection with no specific UI error. | Include `assignedById` from the authenticated user context in the form payload. |
| H15 | Security | All tools pages | — | **No role-based access control on any page.** `AppShell` filters navigation by role (cosmetic only). Any authenticated user — including `viewer` and `operator` roles — can navigate directly to `/tools/inventory/new`, `/tools/cases/new`, etc. and perform all CRUD operations. | Add role checks at the page level (e.g., `if (user.role === 'viewer') redirect(...)`) or a shared `RequireRole` wrapper. |
| H16 | Security | `lib/api/client.ts` | 5, 34–58 | **JWT tokens stored in `localStorage`, vulnerable to XSS token theft.** Any XSS anywhere in the app can exfiltrate `fleetoptima_access_token` and `fleetoptima_refresh_token`, enabling full session takeover. | Store tokens in `HttpOnly` cookies set server-side. If localStorage must be kept, enforce a strict CSP. |
| H17 | Security | `lib/api/client.ts` | 108–185 | **No CSRF protection on state-mutating requests.** No CSRF token or `X-Requested-With` header on POST/PUT/PATCH/DELETE. Mandatory if tokens are migrated to cookies (finding H16). | Add `X-Requested-With: XMLHttpRequest` header to all requests; implement CSRF tokens if migrating to cookies. |
| H18 | Consistency | `lib/api/tools.ts` | 128, 184, 243, 359, 512, 570 | **PUT used instead of PATCH for all update methods.** Established project pattern (vehicles.ts:67) uses `apiClient.patch()`. This is a REST semantics violation affecting all 6 service update methods. | Change all `apiClient.put(...)` in `update()` methods to `apiClient.patch(...)`. |
| H19 | Consistency | `lib/api/tools.ts` | entire file | **No default export.** All other API files (`vehicles.ts`, etc.) use `export default`. `tools.ts` uses only named exports, breaking import symmetry. | Add `export default toolsService` (or a barrel default for multi-service files). |
| H20 | Consistency | `lib/api/tools.ts` | 117–118, 173–174 | **`toSnakeCase` cast on input instead of output; no typed request DTOs.** `vehicles.ts` casts the output: `toSnakeCase(data) as unknown as VehicleCreateRequest`. `tools.ts` casts the input, losing output type checking. No `ToolCreateRequest` / `ToolUpdateRequest` interfaces exist. | Define typed request interfaces in `types.ts`; cast the output of `toSnakeCase` to those types. |
| H21 | Consistency | `tools/categories/`, `tools/locations/` | — | **Missing `error.tsx` and `loading.tsx` in categories/ and locations/**.** All other sub-sections have both files. Without them, Next.js cannot show route-level loading skeletons or catch segment-level errors. *(Also flagged by SaaS Pages auditor.)* | Add `error.tsx` and `loading.tsx` to both directories, matching the pattern in `tools/inventory/`. |
| H22 | Consistency | `tools/inventory/page.tsx` | 96 | **`employees` data typed as `Driver[]`** (semantic mismatch — drivers and employees are different domain concepts). Same issue in `cases/page.tsx:82`. Will cause confusion when `employeesService` is added. | Use the correct `Employee` type, or rename the variable to `drivers` to match the type. |
| H23 | Dead Code | `tools/locations/page.tsx` | 71–83, 208 | **`locationStats` dead computation + spurious API call.** `allTools` is fetched (limit:2000) solely to feed `locationStats`, which is listed in the `columns` memo dep but never read inside any column cell. One extra `getAll` call fires on every page load producing no output. *(Also flagged by Consistency #15.)* | Remove `locationStats`, the `allTools` `useApi` call, and its entry from the `columns` dep array. |
| H24 | Data Integrity | `tools/inventory/[id]/page.tsx` | 110–112 | **Delete failure silently swallowed in inventory detail.** `handleDelete` only resets `isDeleting`; no error is shown to the user on failure. *(Also flagged by Missing Impl #14.)* | Display error alert or toast on delete failure. |

---

## Medium Findings

| # | Category | File | Line(s) | Description | Recommendation |
|---|----------|------|---------|-------------|----------------|
| M1 | Dead Code | `lib/api/index.ts` | 91–96 | 5 list-param types (`ToolListParams`, etc.) re-exported from `index.ts` but never imported by any page — only used internally in `tools.ts`. | Remove from `index.ts` re-exports. |
| M2 | Dead Code | `tools/page.tsx` | 17, 20 | `AlertCircle` and `Clock` imported from `lucide-react` but never used. | Remove both from the import statement. |
| M3 | Missing Impl | Multiple error handlers | various | **12 hardcoded English error fallback strings** not wrapped in `t()` across new/edit/detail pages (`'Failed to create tool.'`, `'Failed to create case.'`, `'Failed to add tool to case.'`, `'Failed to adjust quantity.'`, etc.). Falls back to English even in non-English locales. | Wrap all error fallback strings in `t()` with appropriate keys. |
| M4 | Missing Impl | `en.json` | — | **12 i18n keys referenced in code but not defined** in `en.json` (`tools.actions.convertToCase`, `tools.consumables.delta`, `tools.fields.tools`, etc.). App falls back to inline English strings, masking the gap. | Add all 12 missing keys to `en.json` and any other locale files. |
| M5 | Data Integrity | `lib/api/client.ts` | 154–171 | Non-JSON error responses (e.g., HTML proxy error) throw `parse_error`, hiding the real HTTP status from the UI (tools detail shows "Tool not found" for all network errors). | Check `Content-Type` before parsing; build error directly from HTTP status if not JSON. |
| M6 | Data Integrity | `lib/api/tools.ts` | 92–104 | `limit=0` is not excluded from query params; sending `limit=0` to the backend may silently return zero results. | Validate that `limit` is a positive integer before adding to query params. |
| M7 | Data Integrity | `tools/inventory/page.tsx` | 82–84 | **Hardcoded `limit: 2000`** client-side pagination workaround. Also in `categories/page.tsx:63` and `locations/page.tsx:67`. Silently truncates results if actual count exceeds 2000. *(Also flagged by Consistency #11.)* | Implement server-side pagination or display a warning when returned count equals the limit. |
| M8 | Data Integrity | `tools/inventory/new/page.tsx` | 67–98 | Form validation relies entirely on HTML `required` attributes. No pre-submission checks for `erpCode` format, `calibrationIntervalDays > 0`, or `purchasePrice >= 0`. Errors only surface after API failure. | Add pre-submission validation for format-sensitive fields. |
| M9 | Data Integrity | `tools/assignments/page.tsx` | 91–96 | No loading state shown during filter-triggered refetch. Previous (stale) data remains visible while new data loads. | Show loading overlay or skeleton during filter-triggered refetches. |
| M10 | Data Integrity | `tools/inventory/[id]/page.tsx` | 104–108 | Category and location fetched with fire-and-forget `.then().catch(() => {})`. Failures silently show "Not set" with no error indication; no mechanism to refetch. | Include these fetches in the main `Promise.all` block to unify error state. |
| M11 | Security | `tools/inventory/[id]/page.tsx` + `[id]/edit/page.tsx` + all `[id]` pages | 64 / 38 | **Unvalidated user-supplied `id` params used directly in API path segments.** Raw URL params interpolated into endpoint paths without UUID format validation. | Validate `id` params match UUID format (`/^[0-9a-f-]{36}$/i`) before making API calls. |
| M12 | Security | `components/layout/app-shell.tsx` + all tools pages | 93 / various | **Sensitive data logged to console.** `console.log('Search:', query)` in AppShell and numerous `console.error(error)` calls in tools pages leak search queries and API response bodies in browser devtools. | Remove `console.log` from production. Replace `console.error` with a structured logger that suppresses in production builds. |
| M13 | Consistency | `tools/page.tsx` | 35–91, 156–201 | **Hardcoded `dark:` Tailwind variants** throughout the tools dashboard page. `CLAUDE.md` explicitly prohibits dark-first color tokens by default. No other fleet section uses this. | Remove all `dark:` variant classes to comply with the global light-mode-first rule. |
| M14 | Consistency | `tools/page.tsx` | 239 | **i18n namespace boundary violation.** `t('hub.openModule', 'Open module')` used inside the `tools/` section. All other strings use `tools.*` keys; this breaks module-level translation splitting. | Change to `t('tools.dashboard.openModule', 'Open module')`. |
| M15 | Consistency | `tools/cases/page.tsx` + `tools/inventory/page.tsx` | 46–53 / 49–56 | **Status/condition config objects duplicated** across pages (identical keys, badge variants, label keys). Changes must be made in multiple places. | Extract to a shared `lib/constants/tools.ts` file and import from both pages. |
| M16 | Consistency | `tools/cases/page.tsx` | 47 | **i18n key namespace inconsistency for status labels.** `cases/page.tsx` uses `tools.cases.status.available` while `inventory/page.tsx` uses `tools.status.available` for the same ToolStatus enum value, forcing duplicate entries in translation files. | Standardize on `tools.status.*` across all pages. |
| M17 | Consistency | `tools/inventory/page.tsx` | 84 | **Magic number `limit: 2000`** with no named constant. Also in `categories/page.tsx:63` and `locations/page.tsx:67`. | Define a shared `MAX_LIST_LIMIT` constant or implement pagination. *(Overlaps M7.)* |
| M18 | SaaS Pages | `tools/assignments/` | — | No standalone create page for assignments. The inline dialog flow is complex enough (tool/case selection, assignee type, notes) to warrant a dedicated page, consistent with inventory/cases/consumables. | Consider extracting to `tools/assignments/new/page.tsx`. |
| M19 | Data Integrity | `tools/consumables/[id]/page.tsx` | 48–54 | **`statusConfig` uses hardcoded English labels** instead of i18n keys. List page uses `labelKey` → `t()` consistently; detail page uses raw strings. Breaks localization for the detail view. *(Also flagged by Missing Impl #7.)* | Unify to use `t()` as the primary call, consistent with the list page. |
| M20 | Consistency | `lib/api/tools.ts` | 529–585 | `consumablesService` methods lack JSDoc comments. All other service blocks in the same file have `/** */` comments on every method. | Add JSDoc comments to all `consumablesService` methods. |
| M21 | Data Integrity | `lib/api/tools.ts` | 529–541 | `consumablesService.getAll` declares `unit` in `ConsumableListParams` but never adds it to `queryParams`. Unit filter silently ignored by all callers. | Add `unit: params?.unit` to the `queryParams` object. |
| M22 | Missing Impl | `tools/consumables/[id]/page.tsx` | 49–53 | **`statusConfig` labels hardcoded English without `t()` as primary call.** In a non-English locale the detail page shows English while the list page shows translated text. | Convert all `label` entries to use `t()` as primary source. |
| M23 | Missing Impl | `tools/assignments/page.tsx` | 270, 274 | Hardcoded fallback strings `'Unknown tool'` and `'Unknown case'` in `getItemName()`. Not i18n-wrapped. | Replace with `t('tools.assignments.unknownTool', 'Unknown tool')` etc. |
| M24 | Data Integrity | `tools/cases/page.tsx` | 133–141 | `filteredCases` returns `[]` for both empty-from-API and not-yet-loaded states. Empty list looks identical to loading state if data is cleared mid-session. | Distinguish `undefined`/null from length-0 separately. |

---

## Low Findings

| # | Category | File | Line(s) | Description | Recommendation |
|---|----------|------|---------|-------------|----------------|
| L1 | Missing Impl | `en.json` | — | 12 i18n keys referenced in code but absent from locale file (listed in M4). Fallbacks prevent breakage but block translation. | Add missing keys to all locale files. *(Same as M4 — tracked here for completeness.)* |
| L2 | Missing Impl | `tools/inventory/page.tsx` | 159 | `assigned` status badge uses `'destructive'` variant (red). Red conventionally signals errors, not the normal "assigned" state — misleads users. | Change `assigned` badge to `default` or a neutral blue class. |
| L3 | Data Integrity | `lib/api/tools.ts` | 529–541 | `consumablesService.getAll` silently ignores `unit` filter param (tracked in M21 but confirmed low-impact). | Add `unit` to queryParams. |
| L4 | Data Integrity | `transformers.ts` | 548–562 | `transformToolCase` drops `organization_id` from `ToolCaseResponse`. Field unavailable on domain object. | Map `organizationId: api.organization_id` in `transformToolCase`. |
| L5 | Data Integrity | `data/mock-data.ts` | 888–936 | `toolsNavigation` export defined but not imported anywhere. Dead mock data. | Remove or relocate to a navigation config module where consumed. |
| L6 | Security | `contexts/auth-context.tsx` | 55, 102 | Auth errors logged to console expose session state signals to anyone with browser devtools access. | Suppress or obfuscate auth error logs in production. |
| L7 | Security | `lib/api/client.ts` | 8–9 | Token storage key names (`fleetoptima_access_token`) expose internal product name and architecture in localStorage. | Use opaque key names or migrate to HttpOnly cookies (resolves H16). |
| L8 | Security | `lib/api/client.ts` | 82–83 | Module-level `isRefreshing`/`refreshPromise` state is not coordinated across browser tabs. Two tabs can both trigger a token refresh; if the backend rotates tokens, the second tab's refresh fails and logs the user out unexpectedly. | Use `localStorage` events or `BroadcastChannel` to coordinate refresh across tabs. |
| L9 | Consistency | Multiple `error.tsx` files | all | Hardcoded English strings ("Something went wrong", "Try again") in all tools `error.tsx` files, bypassing the i18n system used everywhere else. | Use `t('common.error.title')` and `t('common.tryAgain')` consistently. |
| L10 | Consistency | `tools/locations/page.tsx` | 172 | Column `id` is `'description'` but the column renders `loc.address`. Copy-paste error; causes incorrect column width/sort persistence in DataTable. | Change column `id` to `'address'`. |
| L11 | Missing Impl | `tools/assignments/page.tsx` | 162 | `"In case: ..."` template literal string visible in SearchableSelect UI. Hardcoded English. | Replace with translated label. |
| L12 | Data Integrity | `tools/cases/page.tsx` | 82, 87, 264 | `employees` and `vehicles` fetched for resolving assignee names but not referenced in any column cell — dead fetch overhead on every cases page load. *(Partially overlaps H1 Dead Code finding.)* | Remove unused `useApi` calls from `cases/page.tsx`. |

---

## Fix Priority Roadmap

### Immediate — CRITICAL (fix before next deploy)

1. **Add auth guard to dashboard layout** (C1 + C2) — Effort: S. Any Next.js Middleware rule or synchronous client gate stops the flash window. Both findings resolve together.
2. **Fix token refresh race condition** (C3) — Effort: S. Two-line fix: assign `refreshPromise` before `isRefreshing = true`.
3. **Add role-based access control to tools pages** (H15) — Effort: M. Add a shared `RequireRole` wrapper or per-page check; navigation filtering alone is RBAC theater.
4. **Fix `toSnakeCase` for nested objects** (C5) — Effort: S. Silent data loss on `images[]` and any nested fields on every create/update.
5. **Fix assignment history fetching** (C6) — Effort: S. Change one `getActive()` call to `getAll({ tool_id })`.
6. **Add assignment detail & edit pages** (C8) — Effort: M. Assignments is the only CRUD sub-section without individual record views.

### Short-term — HIGH (fix this sprint)

7. **Add "Log Calibration" action** (C9 + H5) — Effort: M. `toolCalibrationsService.create()` is fully implemented; just needs a UI entry point.
8. **Fix unsafe enum casts in transformer** (C4) — Effort: S. Add a guard function before casting `conditionAtCheckout`/`conditionAtReturn`.
9. **Remove dead API calls from inventory page** (H1 + H23) — Effort: S. Remove 3–4 `useApi` hooks + dead callbacks; net performance improvement on every page load.
10. **Remove unused service methods from tools.ts** (H2, H3, H4) — Effort: S. 6 method deletions.
11. **Fix all silent error handlers** (H8 + H24) — Effort: M. Add `setError`/toast in 6–7 mutation catch blocks.
12. **Add `organizationId` to Tool/ToolCase domain types** (H9) — Effort: S.
13. **Fix PUT → PATCH in all update methods** (H18) — Effort: S.
14. **Add `error.tsx` and `loading.tsx` to categories/ and locations/`** (H21) — Effort: S.
15. **JWT token storage: migrate to HttpOnly cookies** (H16) — Effort: L. Highest-impact security improvement after auth guard.

### Backlog — MEDIUM + LOW

- **i18n cleanup:** M3, M4, L1, L9, L11 — wrap all hardcoded strings, add 12 missing keys — Effort: M
- **Dark mode removal from tools/page.tsx:** M13 — Effort: S
- **Namespace/duplication cleanup:** M14, M15, M16 — consolidate status config, fix hub.openModule key — Effort: S
- **UUID validation on [id] params:** M11 — Effort: S (add one shared validator)
- **Console logging cleanup:** M12, L6 — Effort: S
- **API fixes:** M5 (Content-Type check), M6 (limit=0 guard), M21 (unit filter), L4 (organizationId in transformToolCase), L10 (column id fix) — Effort: S each
- **Remove remaining dead code:** L5 (toolsNavigation mock), L12 (cases page dead fetches) — Effort: S
- **CSRF protection:** H17 — Effort: M (deferred until token storage is resolved)
- **Category cycle prevention:** H13 — Effort: M
- **Server-side pagination:** M7/M17 — Effort: L (architectural change)

---

## Appendix

Individual audit files:

- [AUDIT_DEAD_CODE.md](./AUDIT_DEAD_CODE.md)
- [AUDIT_MISSING_IMPL.md](./AUDIT_MISSING_IMPL.md)
- [AUDIT_DATA_INTEGRITY.md](./AUDIT_DATA_INTEGRITY.md)
- [AUDIT_SECURITY.md](./AUDIT_SECURITY.md)
- [AUDIT_CONSISTENCY.md](./AUDIT_CONSISTENCY.md)
- [AUDIT_SAAS_PAGES.md](./AUDIT_SAAS_PAGES.md)

### Deduplication Notes

The following raw findings were consolidated in this report:
- Consistency #5 + Missing Impl #5 → merged into **H1** (Dead Code #1 is primary)
- Consistency #15 → merged into **H23** (Dead Code #8 is primary)
- SaaS Pages #1 + #2 → merged into **C8** (Missing Impl #1 is primary, elevated to CRITICAL)
- Missing Impl #14 → merged into **H24** (Data Integrity #13 is primary)
- Missing Impl #7 → merged into **M19** (Data Integrity #16 is primary)
- Consistency #11 + Data Integrity #17 → merged into **M7** (single finding)
- SaaS Pages #4–7 → merged into **H21** (Consistency #4 is primary)
