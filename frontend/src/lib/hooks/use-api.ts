/**
 * Custom hooks for API data fetching
 */

import { useState, useEffect, useCallback } from "react";
import { ApiClientError } from "@/lib/api";

interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

interface UseApiOptions {
  enabled?: boolean;
}

/**
 * Generic hook for fetching data from API
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  dependencies: unknown[] = [],
  options: UseApiOptions = {}
): UseApiState<T> & { refetch: () => Promise<void> } {
  const { enabled = true } = options;
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    isLoading: enabled,
    error: null,
  });

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await fetcher();
      setState({ data, isLoading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        isLoading: false,
        error: error instanceof Error ? error : new Error("An error occurred"),
      });
    }
  }, [fetcher, enabled]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, enabled]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return { ...state, refetch };
}

/**
 * Hook for mutations (create, update, delete)
 */
export function useMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>
) {
  const [state, setState] = useState<{
    data: TData | null;
    isLoading: boolean;
    error: Error | null;
    isSuccess: boolean;
  }>({
    data: null,
    isLoading: false,
    error: null,
    isSuccess: false,
  });

  const mutate = useCallback(
    async (variables: TVariables) => {
      setState({ data: null, isLoading: true, error: null, isSuccess: false });

      try {
        const data = await mutationFn(variables);
        setState({ data, isLoading: false, error: null, isSuccess: true });
        return data;
      } catch (error) {
        const err = error instanceof Error ? error : new Error("An error occurred");
        setState({ data: null, isLoading: false, error: err, isSuccess: false });
        throw err;
      }
    },
    [mutationFn]
  );

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null, isSuccess: false });
  }, []);

  return { ...state, mutate, reset };
}

/**
 * Format API error for display
 */
export function formatApiError(error: Error | null): string {
  if (!error) return "";

  if (error instanceof ApiClientError) {
    if (error.status === 401) return "Please log in to continue";
    if (error.status === 403) return "You do not have permission to perform this action";
    if (error.status === 404) return "The requested resource was not found";
    if (error.status >= 500) return "Server error. Please try again later.";
    return error.message;
  }

  return error.message || "An unexpected error occurred";
}
