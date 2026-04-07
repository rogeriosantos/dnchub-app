# Security Audit — Tools Management Frontend

**Date:** 2026-04-01
**Auditor:** Security Auditor Agent (forge-audit team)
**Scope:** `frontend/src/app/(dashboard)/tools/`, `frontend/src/lib/api/tools.ts`, `frontend/src/lib/api/client.ts`, `frontend/src/contexts/auth-context.tsx`, `frontend/src/app/(dashboard)/layout.tsx`

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 2     |
| HIGH     | 3     |
| MEDIUM   | 3     |
| LOW      | 3     |
| **Total**| **11**|

---

## Findings

| # | Severity | File | Line(s) | Description | Recommendation |
|---|----------|------|---------|-------------|----------------|
| 1 | CRITICAL | `frontend/src/app/(dashboard)/layout.tsx` | 1–9 | **No auth guard in dashboard layout.** The layout wraps all dashboard pages (including all tools pages) but contains zero authentication enforcement — it simply renders `<AppShell>{children}</AppShell>`. Auth is delegated entirely to a `useEffect` redirect in `AuthContext`, which only fires client-side after the page has already rendered. During the render window before `isLoading` resolves, all protected content (data tables, forms, API calls) is visible and interactive without authentication. | Move auth enforcement into the layout itself via a server-side guard or a synchronous client-side gate that renders `null`/redirect until auth is confirmed. Do not rely solely on a `useEffect` redirect for protecting routes. |
| 2 | CRITICAL | `frontend/src/contexts/auth-context.tsx` | 30–76 | **Race condition / TOCTOU in auth flow.** `isAuthenticated` is derived from `!!user` (line 30), but the initial value of `user` is `null`. Before `checkAuth()` resolves, `isAuthenticated` is `false` even for valid sessions. The redirect guard (line 71) reads `!isLoading && !isAuthenticated` but `isLoading` is set to `true` only inside `checkAuth()`, meaning there is a brief window on every page load where the app may redirect a valid, logged-in user to `/login` or allow an unauthenticated user to briefly access protected content. Additionally, `isPublicRoute` defaults to `true` when `pathname` is `null` (line 35), which means if the router hasn't resolved the path yet, auth checks are skipped entirely. | Initialize `isLoading` to `true` at component mount (not conditionally inside the effect). Use a stable loading state before any redirect decision. Consider using Next.js middleware for server-side route protection. |
| 3 | HIGH | `frontend/src/app/(dashboard)/tools/**` (all pages) | All pages | **No role-based access control on any tools page.** The `User` type has a `role` field with values `admin`, `fleet_manager`, `operator`, `viewer`, `technician` (types/index.ts:15). The `AppShell` filters sidebar navigation items by role, but this is purely cosmetic — the underlying pages have no role checks. Any authenticated user (including `viewer` and `operator`) can directly navigate to `/tools/inventory/new`, `/tools/cases/new`, etc. and create, edit, or delete tools, cases, categories, locations, consumables, and calibration records regardless of their role. | Add role checks at the page level (e.g., `if (user.role === 'viewer') redirect(...)`) or via a shared `RequireRole` wrapper component. Do not rely on navigation filtering alone for access control. |
| 4 | HIGH | `frontend/src/lib/api/client.ts` | 5, 34–58 | **JWT tokens stored in `localStorage`, vulnerable to XSS token theft.** `ACCESS_TOKEN_KEY` and `REFRESH_TOKEN_KEY` are stored in `localStorage` (lines 36, 40). Any XSS vulnerability anywhere in the application (or third-party script) can exfiltrate these tokens, leading to full session takeover. The token keys themselves (`fleetoptima_access_token`, `fleetoptima_refresh_token`) also leak the internal product name. | Store tokens in `HttpOnly` cookies (set server-side), which are inaccessible to JavaScript. If localStorage must be used, ensure a strict Content Security Policy is enforced. |
| 5 | HIGH | `frontend/src/lib/api/client.ts` | 108–185 | **No CSRF protection on state-mutating requests.** The API client sends POST, PUT, PATCH, and DELETE requests with `Authorization: Bearer <token>` only. No CSRF token header is included. While Bearer token auth is generally CSRF-safe when browsers enforce `SameSite` cookie restrictions, the fallback redirect at line 148–150 uses `window.location.href = '/login'` which is a direct DOM manipulation. More importantly, if tokens are moved to cookies (recommended for finding #4), CSRF protection becomes mandatory. There is also no `X-Requested-With` header to help backend distinguish AJAX from browser-initiated requests. | Add a `X-Requested-With: XMLHttpRequest` header to all API client requests. If tokens are migrated to cookies, implement CSRF tokens (e.g., double-submit cookie pattern). |
| 6 | MEDIUM | `frontend/src/app/(dashboard)/tools/inventory/[id]/page.tsx` | 64 | **Unvalidated user-supplied ID used directly in API calls.** The `toolId` is taken directly from URL params (`params.id as string`) with no format validation before being interpolated into API endpoint paths (`/tools/${toolId}`, `/tool-calibrations?tool_id=${toolId}`). While the backend should validate IDs, the frontend sends arbitrary user-controlled strings as path segments, which could facilitate path traversal or unexpected backend behavior if the backend has path-matching issues. | Validate that `toolId` matches the expected UUID format before making API calls (e.g., `/^[0-9a-f-]{36}$/i`). Apply the same pattern to all `[id]` route params in edit pages. |
| 7 | MEDIUM | `frontend/src/app/(dashboard)/tools/inventory/[id]/edit/page.tsx` | 38 | **Same unvalidated ID issue in edit page.** `toolId = params.id as string` is used directly in `toolsService.getById(toolId)` and `toolsService.update(toolId, ...)` without format validation. The `convertToCase` action at line 122 also sends the raw param. Same pattern exists in all other `[id]` pages (cases, consumables). | Validate UUID format before API calls across all dynamic route pages. |
| 8 | MEDIUM | `frontend/src/components/layout/app-shell.tsx` | 93–95 | **Sensitive data logged to console in production.** `handleSearch` logs the full search query to `console.log('Search:', query)` (line 93). While this specific log leaks search queries rather than credentials, the pattern is dangerous. Multiple `console.error` calls throughout tools pages (inventory/page.tsx:194, cases/page.tsx:151, categories/page.tsx:137,149, locations/page.tsx:135,147, assignments/page.tsx:372) log full error objects which may include API response bodies, internal paths, or server error messages visible to end users via browser devtools. | Remove `console.log` from production code. Replace `console.error` with a structured logger that suppresses output in production builds. Consider a global error boundary that reports to a monitoring service without exposing raw errors in the console. |
| 9 | LOW | `frontend/src/contexts/auth-context.tsx` | 55, 102 | **Auth errors logged to console expose session state signals.** `console.error("Auth check failed:", error)` and `console.error("Failed to refresh user:", error)` leak auth failure details to the browser console. An attacker with brief physical access can observe when token refresh attempts are failing, leaking session lifecycle information. | Suppress or obfuscate these logs in production. |
| 10 | LOW | `frontend/src/lib/api/client.ts` | 8–9 | **Internal token storage key names expose product name and architecture.** The constants `fleetoptima_access_token` and `fleetoptima_refresh_token` are visible in `localStorage` in any browser devtools session, revealing the internal product name. Minor information disclosure. | Use opaque key names (e.g., `_at`, `_rt`) or, better, migrate to HttpOnly cookies (resolves finding #4 as well). |
| 11 | LOW | `frontend/src/lib/api/client.ts` | 82–83 | **Module-level mutable state for refresh token coordination is not thread-safe across tabs.** `isRefreshing` and `refreshPromise` are module-level variables (lines 82–83). In a multi-tab scenario, two tabs can both enter the refresh flow simultaneously, making two refresh token requests. If the backend invalidates the first refresh token after use (rotation), the second tab's request will fail and log the user out unexpectedly. This is a security/UX issue at the boundary. | Coordinate token refresh across tabs using `localStorage` events or a `BroadcastChannel` to ensure only one tab refreshes at a time. |

---

## Key Observations

### What is done well
- No `dangerouslySetInnerHTML` usage found anywhere in the tools section — React's default escaping is used throughout, preventing XSS via rendered content.
- No hardcoded API keys, secrets, or credentials found in any frontend file.
- Delete operations all use confirmation dialogs before executing.
- The API client handles 401 responses with token refresh and redirect, preventing silent stale-token access.
- Role-based navigation filtering exists in `AppShell` via `filterNavigationByRole`.

### Critical gaps
1. Auth is enforced client-side only via `useEffect`, with a race window where protected pages are accessible before the auth check resolves.
2. Role enforcement exists only in the navigation sidebar — there is zero enforcement on the actual page or action level, making the RBAC model purely cosmetic.

---

## Files Audited

- `frontend/src/app/(dashboard)/layout.tsx`
- `frontend/src/contexts/auth-context.tsx`
- `frontend/src/lib/api/client.ts`
- `frontend/src/lib/api/tools.ts`
- `frontend/src/app/(dashboard)/tools/page.tsx`
- `frontend/src/app/(dashboard)/tools/inventory/page.tsx`
- `frontend/src/app/(dashboard)/tools/inventory/new/page.tsx`
- `frontend/src/app/(dashboard)/tools/inventory/[id]/page.tsx`
- `frontend/src/app/(dashboard)/tools/inventory/[id]/edit/page.tsx`
- `frontend/src/app/(dashboard)/tools/cases/page.tsx`
- `frontend/src/app/(dashboard)/tools/assignments/page.tsx` (partial — file too large)
- `frontend/src/app/(dashboard)/tools/consumables/page.tsx`
- `frontend/src/app/(dashboard)/tools/categories/page.tsx`
- `frontend/src/app/(dashboard)/tools/locations/page.tsx`
- `frontend/src/components/layout/app-shell.tsx`
- `frontend/src/types/index.ts` (for User/role type definitions)
