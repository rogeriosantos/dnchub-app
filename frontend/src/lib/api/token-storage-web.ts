/**
 * Web (localStorage) implementation of TokenStorageAdapter.
 * Defined locally to avoid dependency on @fleet/shared in standalone deploy.
 */

export interface TokenStorageAdapter {
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  setTokens(accessToken: string, refreshToken: string): void;
  clearTokens(): void;
  isAuthenticated(): boolean;
  initialize(): Promise<void>;
}

const ACCESS_TOKEN_KEY = "fleetoptima_access_token";
const REFRESH_TOKEN_KEY = "fleetoptima_refresh_token";

export class WebTokenStorage implements TokenStorageAdapter {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    if (typeof window !== "undefined") {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  async initialize(): Promise<void> {
    if (typeof window !== "undefined") {
      this.accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      this.refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    }
  }
}
