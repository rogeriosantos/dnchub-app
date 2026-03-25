/**
 * Token storage initialization for the web frontend.
 *
 * Creates and initializes a WebTokenStorage instance, loading any
 * persisted tokens from localStorage into memory at app startup.
 * Import once at app startup (e.g. providers.tsx).
 */

import { WebTokenStorage } from "@/lib/api/token-storage-web";

const webTokenStorage = new WebTokenStorage();

// Synchronously load tokens from localStorage into memory
if (typeof window !== "undefined") {
  // initialize() is async for mobile (SecureStore), but localStorage is sync
  // so we can safely call it at module level on web
  webTokenStorage.initialize();
}

/**
 * Exported so auth-context can access the same token storage instance
 * used by the API client.
 */
export { webTokenStorage };
